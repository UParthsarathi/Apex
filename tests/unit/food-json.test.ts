import { describe, expect, it } from 'vitest';
import { extractFoodJson, looksLikeJson, parseFoodJson, parseFoodPaste } from '@/lib/food-json';

const idli = {
  rawInput: '4 idlis and sambar',
  mealType: 'Breakfast',
  items: [{ name: 'Idli', quantity: { value: 4, unit: 'pieces' }, macros: { calories: 260, protein: 4, carbs: 44, fat: 4, fiber: 2 } }],
  totals: { calories: 330, protein: 6, carbs: 50, fat: 7, fiber: 3, sugar: 3, sodium: 770, saturatedFat: 1, cholesterol: 0, potassium: 310, calcium: 55, iron: 2 },
};

describe('parseFoodJson', () => {
  it('reads a well-formed reply: description, meal and all twelve totals', () => {
    const parsed = parseFoodJson(idli, 'Lunch')!;
    expect(parsed.description).toBe('4 idlis and sambar');
    expect(parsed.meal).toBe('Breakfast');
    expect(parsed.nutrition).toMatchObject(idli.totals);
    expect(parsed.nutrition.items).toHaveLength(1);
  });

  it('sums the items when totals are missing, but keeps a genuine 0 total', () => {
    const parsed = parseFoodJson({ items: idli.items, totals: { calories: 0 } }, 'Lunch')!;
    expect(parsed.nutrition.calories).toBe(0);
    expect(parsed.nutrition.protein).toBe(4);
  });

  it('matches mealType by substring and falls back to the chosen meal', () => {
    expect(parseFoodJson({ ...idli, mealType: 'Late dinner' }, 'Lunch')!.meal).toBe('Dinner');
    expect(parseFoodJson({ ...idli, mealType: undefined }, 'Snacks')!.meal).toBe('Snacks');
  });

  it('returns null for objects that are not in the meal format', () => {
    expect(parseFoodJson({ foo: 1 }, 'Lunch')).toBeNull();
    expect(parseFoodJson(null, 'Lunch')).toBeNull();
    expect(parseFoodJson([idli], 'Lunch')).toBeNull();
  });

  it('F-08: stores numbers written as text as numbers', () => {
    const parsed = parseFoodJson({ rawInput: 'x', totals: { calories: '260', protein: '30 g' } }, 'Lunch')!;
    expect(parsed.nutrition.calories).toBe(260);
    expect(parsed.nutrition.protein).toBe(30);
  });

  it('F-08: drops negative and non-numeric values instead of storing them', () => {
    const parsed = parseFoodJson({ rawInput: 'x', totals: { calories: -50, protein: 'lots' } }, 'Lunch')!;
    expect(parsed.nutrition.calories).toBe(0);
    expect(parsed.nutrition.protein).toBe(0);
  });

  it('F-08: keeps only object items, so History cannot crash on them', () => {
    expect(parseFoodJson({ rawInput: 'x', items: 'rice and dal', totals: idli.totals }, 'Lunch')!.nutrition.items).toEqual([]);
    const items = parseFoodJson({ rawInput: 'x', items: [null, 'rice', { name: 'Idli', macros: { calories: '80' } }] }, 'Lunch')!.nutrition.items;
    expect(items).toEqual([{ name: 'Idli', quantity: { value: 0, unit: '' }, macros: expect.objectContaining({ calories: 80, protein: 0 }) }]);
  });

  it('F-08: never stores a non-string description', () => {
    expect(parseFoodJson({ rawInput: { text: 'x' }, items: idli.items }, 'Lunch')!.description).toBe('Idli');
    expect(parseFoodJson({ totals: idli.totals }, 'Lunch')!.description).toBe('Meal');
  });
});

describe('parseFoodPaste', () => {
  it('returns null for ordinary text, which is then logged as a description', () => {
    expect(parseFoodPaste('2 rotis and dal', 'Lunch')).toBeNull();
  });

  it('F-07: reads a reply wrapped in ```json fences', () => {
    const fenced = '```json\n' + JSON.stringify(idli) + '\n```';
    expect(looksLikeJson(fenced)).toBe(true);
    expect(parseFoodPaste(fenced, 'Lunch')).toMatchObject({ total: 1, entries: [{ description: '4 idlis and sambar' }] });
  });

  it('F-07: reports invalid JSON instead of logging it as a 0-kcal text entry', () => {
    expect(parseFoodPaste('{"rawInput":"x","totals":{"calories":260,}}', 'Lunch')).toEqual({ error: expect.stringContaining("Couldn't read that JSON") });
  });

  it('F-07: reports when nothing in an array is in the meal format', () => {
    expect(parseFoodPaste('[{"foo":1},{"bar":2}]', 'Lunch')).toEqual({ error: expect.stringContaining('meal format') });
  });

  it('F-07: logs the valid entries of a mixed array and says how many there were', () => {
    const result = parseFoodPaste(JSON.stringify([idli, { foo: 1 }]), 'Lunch');
    expect(result).toMatchObject({ total: 2, entries: [{ description: '4 idlis and sambar' }] });
  });
});

describe('extractFoodJson (chat replies)', () => {
  it('parses the final JSON reply, fenced or not', () => {
    expect(extractFoodJson(JSON.stringify(idli))).toHaveLength(1);
    expect(extractFoodJson('```\n' + JSON.stringify([idli, idli]) + '\n```')).toHaveLength(2);
  });

  it('ignores conversational replies and broken JSON', () => {
    expect(extractFoodJson('Sounds good! Was that homemade?')).toBeNull();
    expect(extractFoodJson('Here is your log: {"rawInput":"x"}')).toBeNull();
    expect(extractFoodJson('{"rawInput":')).toBeNull();
  });
});
