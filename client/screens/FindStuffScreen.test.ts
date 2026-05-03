import { FIND_STUFF_FONT_SIZE, FIND_STUFF_LABEL } from './FindStuffScreen.constants';

describe('FindStuffScreen constants', () => {
  it('exports a font size of at least 24 sp', () => {
    expect(FIND_STUFF_FONT_SIZE).toBeGreaterThanOrEqual(24);
  });

  it('exports the correct label text', () => {
    expect(FIND_STUFF_LABEL).toBeDefined();
    expect(FIND_STUFF_LABEL).toBe('Find Stuff To Do');
  });
});
