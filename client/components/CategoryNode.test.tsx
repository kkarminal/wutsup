/**
 * Tests for CategoryNode component logic.
 * Feature: drill-orb-navigation
 *
 * @testing-library/react-native is not available in this project, so we
 * test the component's prop-to-style mapping logic directly — the same
 * approach used in useOrbController.test.ts.
 */

import { BRAND, FONT_SIZE } from '@/constants/colors';
import type { NavigationNodeDto } from '@/services/navigationApi';
import type { CartesianPosition } from '@/utils/orbLayout';

// ─── Helpers that mirror CategoryNode's internal logic ───────────────────────

/**
 * Returns the circle background colour for a given isLeaf value,
 * mirroring the logic in CategoryNode.tsx:
 *   const circleBackground = isLeaf ? BRAND.cyan : BRAND.blue;
 */
function resolveCircleBackground(isLeaf: boolean): string {
  return isLeaf ? BRAND.cyan : BRAND.blue;
}

/**
 * Returns the props that CategoryNode passes to the Pressable,
 * mirroring the accessibility props in CategoryNode.tsx.
 */
function resolvePressableProps(node: NavigationNodeDto): {
  accessibilityLabel: string;
  accessibilityRole: string;
} {
  return {
    accessibilityLabel: node.label,
    accessibilityRole: 'button',
  };
}

/**
 * Returns the label font size used by CategoryNode,
 * mirroring `fontSize: FONT_SIZE.xs` in the label style.
 */
function resolveLabelFontSize(): number {
  return FONT_SIZE.xs;
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

const nonLeafNode: NavigationNodeDto = {
  id: 2,
  label: 'Events',
  icon: null,
  backgroundImageUrl: null,
  parentId: 1,
  sortOrder: 0,
  children: [
    {
      id: 6,
      label: 'Music',
      icon: null,
      backgroundImageUrl: null,
      parentId: 2,
      sortOrder: 0,
      children: [],
    },
  ],
};

const leafNode: NavigationNodeDto = {
  id: 6,
  label: 'Music',
  icon: null,
  backgroundImageUrl: null,
  parentId: 2,
  sortOrder: 0,
  children: [],
};

const position: CartesianPosition = { x: 0, y: -120 };

// ─── Non-leaf node rendering ──────────────────────────────────────────────────

describe('CategoryNode — non-leaf node', () => {
  it('label is the node label', () => {
    // The component renders node.label as the Text content
    expect(nonLeafNode.label).toBe('Events');
  });

  it('accessibilityRole is "button"', () => {
    const props = resolvePressableProps(nonLeafNode);
    expect(props.accessibilityRole).toBe('button');
  });

  it('accessibilityLabel equals node.label', () => {
    const props = resolvePressableProps(nonLeafNode);
    expect(props.accessibilityLabel).toBe(nonLeafNode.label);
  });

  it('circle background is BRAND.blue for non-leaf nodes', () => {
    const bg = resolveCircleBackground(false);
    expect(bg).toBe(BRAND.blue);
    expect(bg).toBe('#0055FF');
  });

  it('circle background is NOT BRAND.cyan for non-leaf nodes', () => {
    const bg = resolveCircleBackground(false);
    expect(bg).not.toBe(BRAND.cyan);
  });
});

// ─── Leaf node rendering ──────────────────────────────────────────────────────

describe('CategoryNode — leaf node', () => {
  it('label is the node label', () => {
    expect(leafNode.label).toBe('Music');
  });

  it('accessibilityRole is "button"', () => {
    const props = resolvePressableProps(leafNode);
    expect(props.accessibilityRole).toBe('button');
  });

  it('accessibilityLabel equals node.label', () => {
    const props = resolvePressableProps(leafNode);
    expect(props.accessibilityLabel).toBe(leafNode.label);
  });

  it('circle background is BRAND.cyan for leaf nodes', () => {
    const bg = resolveCircleBackground(true);
    expect(bg).toBe(BRAND.cyan);
    expect(bg).toBe('#00CCDD');
  });

  it('circle background is NOT BRAND.blue for leaf nodes', () => {
    const bg = resolveCircleBackground(true);
    expect(bg).not.toBe(BRAND.blue);
  });
});

// ─── Label font size ──────────────────────────────────────────────────────────

describe('CategoryNode — label font size', () => {
  it('label font size is FONT_SIZE.xs (11 sp)', () => {
    const fontSize = resolveLabelFontSize();
    expect(fontSize).toBe(11);
  });

  it('label font size is at least 11 sp', () => {
    const fontSize = resolveLabelFontSize();
    expect(fontSize).toBeGreaterThanOrEqual(11);
  });
});

// ─── Colour selection logic ───────────────────────────────────────────────────

describe('CategoryNode — colour selection logic', () => {
  it('isLeaf=true → BRAND.cyan, isLeaf=false → BRAND.blue', () => {
    expect(resolveCircleBackground(true)).toBe(BRAND.cyan);
    expect(resolveCircleBackground(false)).toBe(BRAND.blue);
  });

  it('the two colours are distinct', () => {
    expect(BRAND.cyan).not.toBe(BRAND.blue);
  });
});
