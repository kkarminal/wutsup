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

  it('ACTIVITIES_PANEL_LABEL is "Find Stuff To Do"', () => {
    expect(ACTIVITIES_PANEL_LABEL).toBe('Find Stuff To Do');
  });

  it('FOOD_PANEL_ACCESSIBILITY_LABEL is correct', () => {
    expect(FOOD_PANEL_ACCESSIBILITY_LABEL).toBe(
      'Find Food panel — swipe left to explore food options',
    );
  });

  it('ACTIVITIES_PANEL_ACCESSIBILITY_LABEL is correct', () => {
    expect(ACTIVITIES_PANEL_ACCESSIBILITY_LABEL).toBe(
      'Find Stuff To Do panel — swipe right to explore activities',
    );
  });
});
