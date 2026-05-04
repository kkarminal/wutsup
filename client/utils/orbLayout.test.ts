import {
  computeNodeAngle,
  computeRingPositions,
  meetsBackDragThreshold,
  polarToCartesian,
  resolveAnimationConfig,
  RING_RADIUS,
  DRAG_BACK_THRESHOLD,
  DRILL_ANIMATION_DURATION,
  REDUCE_MOTION_DURATION,
} from './orbLayout';

describe('orbLayout', () => {
  describe('computeNodeAngle', () => {
    it('returns 0 for the only node in a ring of 1', () => {
      expect(computeNodeAngle(0, 1)).toBe(0);
    });

    it('returns 0 for index 0 in a ring of 4', () => {
      expect(computeNodeAngle(0, 4)).toBe(0);
    });

    it('returns 90 for index 1 in a ring of 4', () => {
      expect(computeNodeAngle(1, 4)).toBe(90);
    });

    it('returns 180 for index 2 in a ring of 4', () => {
      expect(computeNodeAngle(2, 4)).toBe(180);
    });

    it('returns 270 for index 3 in a ring of 4', () => {
      expect(computeNodeAngle(3, 4)).toBe(270);
    });

    it('distributes 3 nodes evenly at 120-degree intervals', () => {
      expect(computeNodeAngle(0, 3)).toBeCloseTo(0);
      expect(computeNodeAngle(1, 3)).toBeCloseTo(120);
      expect(computeNodeAngle(2, 3)).toBeCloseTo(240);
    });
  });

  describe('polarToCartesian', () => {
    it('places angle 0 (top) at (0, -radius)', () => {
      const result = polarToCartesian({ angle: 0, radius: 100 });
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-100);
    });

    it('places angle 90 (right) at (radius, 0)', () => {
      const result = polarToCartesian({ angle: 90, radius: 100 });
      expect(result.x).toBeCloseTo(100);
      expect(result.y).toBeCloseTo(0);
    });

    it('places angle 180 (bottom) at (0, radius)', () => {
      const result = polarToCartesian({ angle: 180, radius: 100 });
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(100);
    });

    it('places angle 270 (left) at (-radius, 0)', () => {
      const result = polarToCartesian({ angle: 270, radius: 100 });
      expect(result.x).toBeCloseTo(-100);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('computeRingPositions', () => {
    it('returns the correct number of positions', () => {
      expect(computeRingPositions(4)).toHaveLength(4);
      expect(computeRingPositions(1)).toHaveLength(1);
      expect(computeRingPositions(8)).toHaveLength(8);
    });

    it('places all 4 nodes at distance RING_RADIUS from origin', () => {
      const positions = computeRingPositions(4);
      for (const pos of positions) {
        const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2);
        expect(dist).toBeCloseTo(RING_RADIUS, 3);
      }
    });

    it('places a single node at the top (0, -RING_RADIUS)', () => {
      const [pos] = computeRingPositions(1);
      expect(pos.x).toBeCloseTo(0);
      expect(pos.y).toBeCloseTo(-RING_RADIUS);
    });
  });

  describe('meetsBackDragThreshold', () => {
    it('returns true at exactly the threshold (40)', () => {
      expect(meetsBackDragThreshold(DRAG_BACK_THRESHOLD)).toBe(true);
    });

    it('returns true above the threshold', () => {
      expect(meetsBackDragThreshold(41)).toBe(true);
      expect(meetsBackDragThreshold(100)).toBe(true);
    });

    it('returns false just below the threshold (39)', () => {
      expect(meetsBackDragThreshold(39)).toBe(false);
    });

    it('returns false at 0', () => {
      expect(meetsBackDragThreshold(0)).toBe(false);
    });
  });

  describe('resolveAnimationConfig', () => {
    it('returns fade config with short duration when reduceMotion is true', () => {
      const config = resolveAnimationConfig(true);
      expect(config.type).toBe('fade');
      expect(config.duration).toBeLessThanOrEqual(200);
      expect(config.duration).toBe(REDUCE_MOTION_DURATION);
    });

    it('returns zoom config with standard duration when reduceMotion is false', () => {
      const config = resolveAnimationConfig(false);
      expect(config.type).toBe('zoom');
      expect(config.duration).toBeLessThanOrEqual(400);
      expect(config.duration).toBe(DRILL_ANIMATION_DURATION);
    });
  });
});
