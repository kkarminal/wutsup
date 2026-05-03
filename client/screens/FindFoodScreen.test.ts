import { FIND_FOOD_FONT_SIZE, FIND_FOOD_LABEL } from './FindFoodScreen.constants';

describe('FindFoodScreen constants', () => {
  it('exports a font size of at least 24 sp', () => {
    expect(FIND_FOOD_FONT_SIZE).toBeGreaterThanOrEqual(24);
  });

  it('exports the correct label text', () => {
    expect(FIND_FOOD_LABEL).toBeDefined();
    expect(FIND_FOOD_LABEL).toBe('Find Food');
  });
});
