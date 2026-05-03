import {
  FOOD_PANEL_LABEL,
  ACTIVITIES_PANEL_LABEL,
  FOOD_PANEL_ACCESSIBILITY_LABEL,
  ACTIVITIES_PANEL_ACCESSIBILITY_LABEL,
} from './DashboardScreen.constants';

describe('DashboardScreen constants', () => {
  it('FOOD_PANEL_LABEL is "Find Food"', () => {
    expect(FOOD_PANEL_LABEL).toBe('Find Food');
  });

  it('ACTIVITIES_PANEL_LABEL is "Up & About"', () => {
    expect(ACTIVITIES_PANEL_LABEL).toBe('Up & About');
  });

  it('FOOD_PANEL_ACCESSIBILITY_LABEL is correct', () => {
    expect(FOOD_PANEL_ACCESSIBILITY_LABEL).toBe('Find Food tab');
  });

  it('ACTIVITIES_PANEL_ACCESSIBILITY_LABEL is correct', () => {
    expect(ACTIVITIES_PANEL_ACCESSIBILITY_LABEL).toBe(
      'Up & About tab — events, bars, concerts and activities near you',
    );
  });
});
