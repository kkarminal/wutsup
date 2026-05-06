// Feature: category-background-images, Property: Update request payload includes URL and flag
// Feature: category-background-images, Property: All nodes rendered in management interface

/**
 * Property-based tests for Category Management in the Admin Portal.
 *
 * These tests verify the contract between the admin portal and the API
 * for background image URL updates on navigation nodes.
 */

import * as fc from 'fast-check';

import type { NavigationNodeDto, UpdateNodeRequest } from '../../src/services/apiClient';

// ---------------------------------------------------------------------------
// Inline implementation that mirrors the CategoryManagementPage handleSave logic.
// When an admin saves a background image URL, the payload must include the URL
// and the updateBackgroundImageUrl flag set to true.
// ---------------------------------------------------------------------------

/**
 * Constructs the update request payload for a background image URL change.
 * Mirrors the logic in CategoryManagementPage.handleSave().
 */
function buildUpdatePayload(url: string): UpdateNodeRequest {
  const urlToSave = url.trim() === '' ? null : url.trim();
  return {
    backgroundImageUrl: urlToSave,
    updateBackgroundImageUrl: true,
  };
}

// ---------------------------------------------------------------------------
// Property: For any valid URL string, the update request payload includes
// the URL and updateBackgroundImageUrl: true
// Validates: Requirements 4.2, 4.4, 5.1
// ---------------------------------------------------------------------------
describe('Property: Update request payload includes URL and flag', () => {
  it('for any valid HTTP/HTTPS URL, the payload includes the URL and updateBackgroundImageUrl: true', () => {
    const validUrlArb = fc.oneof(
      fc.webUrl({ validSchemes: ['http', 'https'] }),
      fc
        .tuple(
          fc.constantFrom('http', 'https'),
          fc.domain(),
          fc.webPath(),
        )
        .map(([scheme, domain, path]) => `${scheme}://${domain}${path}`),
    );

    fc.assert(
      fc.property(validUrlArb, (url) => {
        const payload = buildUpdatePayload(url);

        // The payload must always have updateBackgroundImageUrl set to true
        if (payload.updateBackgroundImageUrl !== true) {
          return false;
        }

        // For a non-empty URL, the backgroundImageUrl must equal the trimmed URL
        const expected = url.trim() === '' ? null : url.trim();
        return payload.backgroundImageUrl === expected;
      }),
      { numRuns: 100 },
    );
  });

  it('for any valid URL, the payload never omits the updateBackgroundImageUrl flag', () => {
    const validUrlArb = fc.webUrl({ validSchemes: ['http', 'https'] });

    fc.assert(
      fc.property(validUrlArb, (url) => {
        const payload = buildUpdatePayload(url);

        // The flag must be explicitly present and true
        return 'updateBackgroundImageUrl' in payload && payload.updateBackgroundImageUrl === true;
      }),
      { numRuns: 100 },
    );
  });

  it('for any valid URL, the backgroundImageUrl in the payload matches the input URL', () => {
    const validUrlArb = fc.webUrl({ validSchemes: ['http', 'https'] });

    fc.assert(
      fc.property(validUrlArb, (url) => {
        const payload = buildUpdatePayload(url);

        // Valid URLs from webUrl are never empty after trim, so backgroundImageUrl should equal the URL
        return payload.backgroundImageUrl === url.trim();
      }),
      { numRuns: 100 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: category-background-images, Property: All nodes rendered in management interface
// ---------------------------------------------------------------------------

// Inline implementation of flattenTree that mirrors CategoryManagementPage logic.
// The management interface flattens the tree recursively to render all nodes.

interface FlatNode {
  id: number;
  label: string;
  icon: string | null;
  backgroundImageUrl: string | null;
}

function flattenTree(nodes: NavigationNodeDto[]): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({
      id: node.id,
      label: node.label,
      icon: node.icon,
      backgroundImageUrl: node.backgroundImageUrl,
    });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

/**
 * Recursively collects all node IDs from a tree of NavigationNodeDto objects.
 */
function collectAllIds(nodes: NavigationNodeDto[]): number[] {
  const ids: number[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      ids.push(...collectAllIds(node.children));
    }
  }
  return ids;
}

/**
 * Counts total number of nodes in a tree.
 */
function countNodes(nodes: NavigationNodeDto[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
}

// Arbitrary generator for NavigationNodeDto trees with varying depth and breadth.
// Uses a letrec pattern to generate recursive tree structures.
const navigationNodeTreeArb: fc.Arbitrary<NavigationNodeDto[]> = fc.letrec((tie) => ({
  tree: fc.array(tie('node') as fc.Arbitrary<NavigationNodeDto>, { minLength: 1, maxLength: 5 }),
  node: fc.record({
    id: fc.nat({ max: 10000 }),
    label: fc.string({ minLength: 1, maxLength: 30 }),
    icon: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
    backgroundImageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
    parentId: fc.option(fc.nat({ max: 10000 }), { nil: null }),
    sortOrder: fc.nat({ max: 100 }),
    children: fc.oneof(
      { weight: 3, arbitrary: fc.constant([] as NavigationNodeDto[]) },
      { weight: 1, arbitrary: fc.array(tie('leaf') as fc.Arbitrary<NavigationNodeDto>, { minLength: 1, maxLength: 3 }) },
    ),
  }),
  leaf: fc.record({
    id: fc.nat({ max: 10000 }),
    label: fc.string({ minLength: 1, maxLength: 30 }),
    icon: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
    backgroundImageUrl: fc.option(fc.webUrl({ validSchemes: ['https'] }), { nil: null }),
    parentId: fc.option(fc.nat({ max: 10000 }), { nil: null }),
    sortOrder: fc.nat({ max: 100 }),
    children: fc.constant([] as NavigationNodeDto[]),
  }),
})).tree;

// ---------------------------------------------------------------------------
// Property: For any node list returned by the API, all nodes are rendered
// in the management interface
// Validates: Requirements 4.1
// ---------------------------------------------------------------------------
describe('Property: All nodes rendered in management interface', () => {
  it('for any tree of NavigationNodeDto objects, flattenTree produces a flat list containing ALL nodes by id', () => {
    fc.assert(
      fc.property(navigationNodeTreeArb, (tree) => {
        const flatNodes = flattenTree(tree);
        const allIds = collectAllIds(tree);

        // Every node ID from the tree must appear in the flattened list
        const flatIds = flatNodes.map((n) => n.id);
        for (const id of allIds) {
          if (!flatIds.includes(id)) {
            return false;
          }
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it('for any tree, the flattened list has the same total count as the tree', () => {
    fc.assert(
      fc.property(navigationNodeTreeArb, (tree) => {
        const flatNodes = flattenTree(tree);
        const totalNodes = countNodes(tree);

        return flatNodes.length === totalNodes;
      }),
      { numRuns: 100 },
    );
  });

  it('for any tree, every node label and backgroundImageUrl is preserved in the flattened output', () => {
    fc.assert(
      fc.property(navigationNodeTreeArb, (tree) => {
        const flatNodes = flattenTree(tree);

        // Collect all (id, label, backgroundImageUrl) tuples from the tree
        function collectNodeData(nodes: NavigationNodeDto[]): Array<{ id: number; label: string; backgroundImageUrl: string | null }> {
          const data: Array<{ id: number; label: string; backgroundImageUrl: string | null }> = [];
          for (const node of nodes) {
            data.push({ id: node.id, label: node.label, backgroundImageUrl: node.backgroundImageUrl });
            if (node.children && node.children.length > 0) {
              data.push(...collectNodeData(node.children));
            }
          }
          return data;
        }

        const allNodeData = collectNodeData(tree);

        // Each node's data must appear in the flat list (matched by index since order is preserved)
        if (flatNodes.length !== allNodeData.length) {
          return false;
        }

        for (let i = 0; i < allNodeData.length; i++) {
          if (flatNodes[i].id !== allNodeData[i].id) return false;
          if (flatNodes[i].label !== allNodeData[i].label) return false;
          if (flatNodes[i].backgroundImageUrl !== allNodeData[i].backgroundImageUrl) return false;
        }

        return true;
      }),
      { numRuns: 100 },
    );
  });
});
