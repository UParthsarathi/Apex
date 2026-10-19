import { describe, expect, it } from 'vitest';
import { NUTRIENT_KEYS } from '@/lib/entries';
import { parseFoodPaste, stripFences } from '@/lib/food-json';
import { FOOD_PROMPT } from '@/lib/food-prompt';

// The example JSON block at the end of the prompt, fences included, exactly as an AI would send it.
const example = FOOD_PROMPT.slice(FOOD_PROMPT.lastIndexOf('```json'));

describe('FOOD_PROMPT', () => {
  it("its example is something the app's paste box logs", () => {
    const result = parseFoodPaste(example, 'Lunch');
    expect(result).toMatchObject({ total: 1, entries: [{ meal: 'Breakfast', nutrition: { calories: 330, protein: 6 } }] });
  });

  it('its example uses every nutrient key the app stores, and totals add up', () => {
    const meal = JSON.parse(stripFences(example));
    for (const macros of [...meal.items.map((i: { macros: object }) => i.macros), meal.totals]) {
      expect(Object.keys(macros).sort()).toEqual([...NUTRIENT_KEYS].sort());
    }
    for (const k of NUTRIENT_KEYS) {
      expect(meal.totals[k]).toBe(meal.items.reduce((sum: number, i: { macros: Record<string, number> }) => sum + i.macros[k], 0));
    }
  });
});
