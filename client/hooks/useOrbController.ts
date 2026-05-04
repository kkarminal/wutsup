import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import Constants from 'expo-constants';

import { createNavigationApiClient, NavigationNodeDto } from '@/services/navigationApi';
import { loadConfig } from '@/services/config';
import { DRILL_ANIMATION_DURATION, BACK_ANIMATION_DURATION } from '@/utils/orbLayout';

export type OrbState = 'loading' | 'error' | 'ready' | 'open' | 'animating' | 'closing';

export interface OrbControllerResult {
  orbState: OrbState;
  activeNode: NavigationNodeDto | null;
  parentNode: NavigationNodeDto | null;
  breadcrumb: string[];
  breadcrumbIds: number[];
  childNodes: NavigationNodeDto[];
  isAnimating: SharedValue<boolean>;
  openMenu: () => void;
  closeMenu: () => void;
  finalizeClose: () => void;
  drillInto: (node: NavigationNodeDto) => void;
  navigateBack: () => void;
  navigateTo: (nodeId: number) => void;
  retryFetch: () => void;
}

/**
 * Recursively flattens a navigation tree into a Map<id, node> for O(1) lookup.
 */
function buildNodeMap(
  node: NavigationNodeDto,
  map: Map<number, NavigationNodeDto>
): void {
  map.set(node.id, node);
  for (const child of node.children) {
    buildNodeMap(child, map);
  }
}

/**
 * Resolves the API base URL in a way that works on both iOS and Android.
 *
 * On the Android emulator, `localhost` refers to the emulator itself, not the
 * host machine. The standard alias for the host machine from the Android
 * emulator is always `10.0.2.2`.
 *
 * Strategy (in priority order):
 * 1. If Expo Go exposes a hostUri (LAN IP), use that host with port 5000.
 * 2. If running on Android and the env URL points to localhost, rewrite to 10.0.2.2.
 * 3. Fall back to the env var as-is (correct for iOS simulator and production).
 */
function resolveApiBaseUrl(): string {
  const envUrl = loadConfig().apiBaseUrl;

  // 1. Expo Go dev server host — works for both physical devices and emulators
  //    when the dev server is reachable over LAN.
  const hostUri = Constants.expoGoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  // 2. Android emulator: rewrite localhost → 10.0.2.2
  if (Platform.OS === 'android') {
    return envUrl
      .replace('localhost', '10.0.2.2')
      .replace('127.0.0.1', '10.0.2.2');
  }

  // 3. iOS simulator / production: use env var directly
  return envUrl;
}

export function useOrbController(): OrbControllerResult {
  // Stable ref for the api client — created once, never recreated on re-render.
  // resolveApiBaseUrl() picks the correct host for both iOS and Android.
  const navigationApiRef = useRef(
    createNavigationApiClient(resolveApiBaseUrl())
  );

  // Log the resolved URL once on mount so it's visible in Metro logs.
  useEffect(() => {
    console.log('[useOrbController] API base URL:', resolveApiBaseUrl());
  }, []);

  const [orbState, setOrbState] = useState<OrbState>('loading');
  const [activeNode, setActiveNode] = useState<NavigationNodeDto | null>(null);
  const [parentNode, setParentNode] = useState<NavigationNodeDto | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [breadcrumbIds, setBreadcrumbIds] = useState<number[]>([]);
  const [childNodes, setChildNodes] = useState<NavigationNodeDto[]>([]);

  const treeRoot = useRef<NavigationNodeDto | null>(null);
  const nodeMap = useRef<Map<number, NavigationNodeDto>>(new Map());

  const isAnimating = useSharedValue<boolean>(false);

  const fetchTree = useCallback(async () => {
    try {
      const root = await navigationApiRef.current.getTree();
      const map = new Map<number, NavigationNodeDto>();
      buildNodeMap(root, map);
      treeRoot.current = root;
      nodeMap.current = map;
      setOrbState('ready');
    } catch (err) {
      console.error('[useOrbController] fetchTree failed:', err);
      setOrbState('error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTree();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openMenu = useCallback(() => {
    if (orbState !== 'ready') return;
    const root = treeRoot.current;
    if (!root) return;
    setActiveNode(root);
    setParentNode(null);
    setBreadcrumb([root.label]);
    setBreadcrumbIds([root.id]);
    setChildNodes(root.children);
    setOrbState('open');
  }, [orbState]);

  const closeMenu = useCallback(() => {
    // Set 'closing' so PieMenu can play its exit animation.
    // activeNode stays alive until the animation finishes.
    setOrbState('closing');
  }, []);

  /** Called by PieMenu after the close animation completes. */
  const finalizeClose = useCallback(() => {
    setOrbState('ready');
    setActiveNode(null);
    setParentNode(null);
    setBreadcrumb([]);
    setBreadcrumbIds([]);
    setChildNodes([]);
  }, []);

  const drillInto = useCallback(
    (node: NavigationNodeDto) => {
      if (isAnimating.value === true) return;

      if (node.children.length === 0) {
        // Leaf node — emit selection event and close
        console.log('Navigation selection:', { id: node.id, label: node.label });
        closeMenu();
        return;
      }

      isAnimating.value = true;
      setParentNode(activeNode);
      setActiveNode(node);
      setBreadcrumb((prev) => [...prev, node.label]);
      setBreadcrumbIds((prev) => [...prev, node.id]);
      setChildNodes(node.children);
      setOrbState('animating');

      setTimeout(() => {
        isAnimating.value = false;
        setOrbState('open');
      }, DRILL_ANIMATION_DURATION);
    },
    [isAnimating, closeMenu]
  );

  const navigateBack = useCallback(() => {
    if (isAnimating.value === true) return;

    const root = treeRoot.current;
    if (!activeNode || !root) return;

    if (activeNode.id === root.id) {
      closeMenu();
      return;
    }

    // Pop last breadcrumb entry
    setBreadcrumb((prev) => prev.slice(0, -1));
    setBreadcrumbIds((prev) => {
      const newIds = prev.slice(0, -1);
      const parentId = activeNode.parentId;
      if (parentId != null) {
        const parent = nodeMap.current.get(parentId);
        if (parent) {
          setActiveNode(parent);
          setChildNodes(parent.children);
          // grandparent becomes the new parentNode
          const grandparentId = parent.parentId;
          setParentNode(
            grandparentId != null
              ? (nodeMap.current.get(grandparentId) ?? null)
              : null,
          );
        }
      }
      return newIds;
    });

    isAnimating.value = true;
    setOrbState('animating');

    setTimeout(() => {
      isAnimating.value = false;
      setOrbState('open');
    }, BACK_ANIMATION_DURATION);
  }, [isAnimating, activeNode, closeMenu]);

  const navigateTo = useCallback(
    (nodeId: number) => {
      if (isAnimating.value === true) return;

      const node = nodeMap.current.get(nodeId);
      if (!node) return;

      setBreadcrumbIds((prevIds) => {
        const index = prevIds.indexOf(nodeId);
        if (index === -1) return prevIds;

        const newIds = prevIds.slice(0, index + 1);
        setBreadcrumb((prevLabels) => prevLabels.slice(0, index + 1));
        setActiveNode(node);
        setChildNodes(node.children);
        // parent is the node one level up in the new breadcrumb
        const parentId = node.parentId;
        setParentNode(
          parentId != null ? (nodeMap.current.get(parentId) ?? null) : null,
        );
        return newIds;
      });
    },
    [isAnimating]
  );

  const retryFetch = useCallback(() => {
    setOrbState('loading');
    fetchTree();
  }, [fetchTree]);

  return {
    orbState,
    activeNode,
    parentNode,
    breadcrumb,
    breadcrumbIds,
    childNodes,
    isAnimating,
    openMenu,
    closeMenu,
    finalizeClose,
    drillInto,
    navigateBack,
    navigateTo,
    retryFetch,
  };
}
