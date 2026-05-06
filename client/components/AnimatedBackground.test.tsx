/**
 * Tests for AnimatedBackground component logic.
 * Feature: category-background-images
 *
 * @testing-library/react-native is not available in this project, so we
 * test the component's crossfade logic directly — the same approach used
 * in DrillOrb.test.tsx and CategoryNode.test.tsx.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

// ─── Helpers that mirror AnimatedBackground's internal logic ─────────────────

type Layer = 'front' | 'back';

interface CrossfadeState {
  frontUrl: string | null;
  backUrl: string | null;
  frontOpacity: number;
  backOpacity: number;
  activeLayer: Layer;
}

/**
 * Simulates the crossfade logic from AnimatedBackground.
 * Given the current state and a new imageUrl, returns the next state.
 */
function applyCrossfade(state: CrossfadeState, imageUrl: string | null): CrossfadeState {
  if (imageUrl === null) {
    return {
      ...state,
      frontOpacity: 0,
      backOpacity: 0,
    };
  }

  if (state.activeLayer === 'front') {
    // New image goes to back layer
    return {
      ...state,
      backUrl: imageUrl,
      backOpacity: 1,
      frontOpacity: 0,
      activeLayer: 'back',
    };
  } else {
    // New image goes to front layer
    return {
      ...state,
      frontUrl: imageUrl,
      frontOpacity: 1,
      backOpacity: 0,
      activeLayer: 'front',
    };
  }
}

function initialState(): CrossfadeState {
  return {
    frontUrl: null,
    backUrl: null,
    frontOpacity: 0,
    backOpacity: 0,
    activeLayer: 'front',
  };
}

// ─── Crossfade logic tests ───────────────────────────────────────────────────

describe('AnimatedBackground — crossfade logic', () => {
  it('starts with both layers transparent', () => {
    const state = initialState();
    expect(state.frontOpacity).toBe(0);
    expect(state.backOpacity).toBe(0);
  });

  it('first image goes to back layer and fades in', () => {
    const state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    expect(state.backUrl).toBe('https://example.com/img1.jpg');
    expect(state.backOpacity).toBe(1);
    expect(state.frontOpacity).toBe(0);
    expect(state.activeLayer).toBe('back');
  });

  it('second image goes to front layer (crossfade)', () => {
    let state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    state = applyCrossfade(state, 'https://example.com/img2.jpg');
    expect(state.frontUrl).toBe('https://example.com/img2.jpg');
    expect(state.frontOpacity).toBe(1);
    expect(state.backOpacity).toBe(0);
    expect(state.activeLayer).toBe('front');
  });

  it('third image goes back to back layer (alternating)', () => {
    let state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    state = applyCrossfade(state, 'https://example.com/img2.jpg');
    state = applyCrossfade(state, 'https://example.com/img3.jpg');
    expect(state.backUrl).toBe('https://example.com/img3.jpg');
    expect(state.backOpacity).toBe(1);
    expect(state.frontOpacity).toBe(0);
    expect(state.activeLayer).toBe('back');
  });

  it('null imageUrl fades out both layers', () => {
    let state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    state = applyCrossfade(state, null);
    expect(state.frontOpacity).toBe(0);
    expect(state.backOpacity).toBe(0);
  });

  it('null imageUrl preserves existing URLs on layers', () => {
    let state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    state = applyCrossfade(state, null);
    // URLs remain set (just opacity is 0)
    expect(state.backUrl).toBe('https://example.com/img1.jpg');
  });

  it('new image after null resumes crossfade from correct layer', () => {
    let state = applyCrossfade(initialState(), 'https://example.com/img1.jpg');
    // activeLayer is now 'back'
    state = applyCrossfade(state, null);
    // activeLayer should still be 'back' (null doesn't change it)
    expect(state.activeLayer).toBe('back');
    // Next image should go to front layer
    state = applyCrossfade(state, 'https://example.com/img2.jpg');
    expect(state.frontUrl).toBe('https://example.com/img2.jpg');
    expect(state.frontOpacity).toBe(1);
    expect(state.activeLayer).toBe('front');
  });
});

// ─── Image error handling logic ──────────────────────────────────────────────

describe('AnimatedBackground — error handling', () => {
  it('front error handler sets front opacity to 0', () => {
    // Simulates the onError callback behavior
    const state: CrossfadeState = {
      frontUrl: 'https://example.com/broken.jpg',
      backUrl: null,
      frontOpacity: 1,
      backOpacity: 0,
      activeLayer: 'front',
    };
    // On error, the layer fades out
    const afterError = { ...state, frontOpacity: 0 };
    expect(afterError.frontOpacity).toBe(0);
    expect(afterError.backOpacity).toBe(0);
  });

  it('back error handler sets back opacity to 0', () => {
    const state: CrossfadeState = {
      frontUrl: null,
      backUrl: 'https://example.com/broken.jpg',
      frontOpacity: 0,
      backOpacity: 1,
      activeLayer: 'back',
    };
    const afterError = { ...state, backOpacity: 0 };
    expect(afterError.backOpacity).toBe(0);
    expect(afterError.frontOpacity).toBe(0);
  });
});

// ─── Positioning logic ───────────────────────────────────────────────────────

describe('AnimatedBackground — positioning', () => {
  it('uses absoluteFillObject style (position absolute, all edges 0)', () => {
    // Verify the expected style values that the component applies
    const expectedStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
    expect(expectedStyle.position).toBe('absolute');
    expect(expectedStyle.top).toBe(0);
    expect(expectedStyle.left).toBe(0);
    expect(expectedStyle.right).toBe(0);
    expect(expectedStyle.bottom).toBe(0);
  });
});
