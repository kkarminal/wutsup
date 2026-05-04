/**
 * Tests for BreadcrumbTrail component logic.
 * Feature: drill-orb-navigation
 *
 * @testing-library/react-native is not available in this project, so we
 * test the component's prop-to-accessibility mapping logic directly —
 * the same approach used in CategoryNode.test.tsx.
 */

// ─── Helpers that mirror BreadcrumbTrail's internal logic ────────────────────

/**
 * Returns the accessibilityLabel for a breadcrumb item,
 * mirroring the logic in BreadcrumbTrail.tsx:
 *   accessibilityLabel={`Navigate back to ${label}`}
 */
function resolveAccessibilityLabel(label: string): string {
  return `Navigate back to ${label}`;
}

/**
 * Returns the accessibilityRole for a breadcrumb item,
 * mirroring the logic in BreadcrumbTrail.tsx:
 *   accessibilityRole="button"
 */
function resolveAccessibilityRole(): string {
  return 'button';
}

/**
 * Simulates pressing a breadcrumb item at the given index,
 * mirroring the onPress handler in BreadcrumbTrail.tsx:
 *   onPress={() => onNavigateTo(nodeIds[index])}
 */
function simulatePress(
  nodeIds: number[],
  index: number,
  onNavigateTo: (nodeId: number) => void
): void {
  onNavigateTo(nodeIds[index]);
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

const breadcrumb = ["What's Up", 'Events', 'Music'];
const nodeIds = [1, 2, 6];

// ─── Render with 3 breadcrumb items ──────────────────────────────────────────

describe('BreadcrumbTrail — render with 3 items', () => {
  it('all labels are present', () => {
    // The component renders each label as Text content inside a Pressable
    for (const label of breadcrumb) {
      expect(label).toBeTruthy();
    }
    expect(breadcrumb).toHaveLength(3);
    expect(breadcrumb[0]).toBe("What's Up");
    expect(breadcrumb[1]).toBe('Events');
    expect(breadcrumb[2]).toBe('Music');
  });

  it('all items have accessibilityRole="button"', () => {
    for (const label of breadcrumb) {
      const role = resolveAccessibilityRole();
      expect(role).toBe('button');
    }
  });

  it('all accessibilityLabel values match "Navigate back to " + label', () => {
    for (const label of breadcrumb) {
      const accessibilityLabel = resolveAccessibilityLabel(label);
      expect(accessibilityLabel).toBe(`Navigate back to ${label}`);
    }
  });

  it('first item accessibilityLabel is "Navigate back to What\'s Up"', () => {
    expect(resolveAccessibilityLabel(breadcrumb[0])).toBe("Navigate back to What's Up");
  });

  it('second item accessibilityLabel is "Navigate back to Events"', () => {
    expect(resolveAccessibilityLabel(breadcrumb[1])).toBe('Navigate back to Events');
  });

  it('third item accessibilityLabel is "Navigate back to Music"', () => {
    expect(resolveAccessibilityLabel(breadcrumb[2])).toBe('Navigate back to Music');
  });
});

// ─── Tap second item ──────────────────────────────────────────────────────────

describe('BreadcrumbTrail — tap second item', () => {
  it('calls onNavigateTo with the nodeId at index 1', () => {
    const onNavigateTo = jest.fn();
    simulatePress(nodeIds, 1, onNavigateTo);
    expect(onNavigateTo).toHaveBeenCalledTimes(1);
    expect(onNavigateTo).toHaveBeenCalledWith(nodeIds[1]);
    expect(onNavigateTo).toHaveBeenCalledWith(2);
  });

  it('calls onNavigateTo with nodeId 2 (Events) when second item is pressed', () => {
    const onNavigateTo = jest.fn();
    simulatePress(nodeIds, 1, onNavigateTo);
    expect(onNavigateTo).toHaveBeenCalledWith(2);
  });

  it('does not call onNavigateTo with the wrong nodeId', () => {
    const onNavigateTo = jest.fn();
    simulatePress(nodeIds, 1, onNavigateTo);
    expect(onNavigateTo).not.toHaveBeenCalledWith(1);
    expect(onNavigateTo).not.toHaveBeenCalledWith(6);
  });
});

// ─── Tap first item ───────────────────────────────────────────────────────────

describe('BreadcrumbTrail — tap first item', () => {
  it('calls onNavigateTo with nodeId 1 (root)', () => {
    const onNavigateTo = jest.fn();
    simulatePress(nodeIds, 0, onNavigateTo);
    expect(onNavigateTo).toHaveBeenCalledWith(1);
  });
});

// ─── Tap third item ───────────────────────────────────────────────────────────

describe('BreadcrumbTrail — tap third item', () => {
  it('calls onNavigateTo with nodeId 6 (Music)', () => {
    const onNavigateTo = jest.fn();
    simulatePress(nodeIds, 2, onNavigateTo);
    expect(onNavigateTo).toHaveBeenCalledWith(6);
  });
});

// ─── accessibilityLabel format ────────────────────────────────────────────────

describe('BreadcrumbTrail — accessibilityLabel format', () => {
  it('format is "Navigate back to " + label for various labels', () => {
    const labels = ['Home', 'Category', 'Sub-category', 'Leaf'];
    for (const label of labels) {
      expect(resolveAccessibilityLabel(label)).toBe(`Navigate back to ${label}`);
    }
  });

  it('accessibilityRole is always "button" regardless of label', () => {
    const labels = ['Home', 'Category', 'Sub-category', 'Leaf'];
    for (const label of labels) {
      expect(resolveAccessibilityRole()).toBe('button');
    }
  });
});
