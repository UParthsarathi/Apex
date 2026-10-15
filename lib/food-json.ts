import { NUTRIENT_KEYS, type FoodEntry, type FoodItem, type NutrientKey } from '@/lib/entries';

type Meal = FoodEntry['meal'];

export type ParsedFood = {
  meal: Meal;
  description: string;
  nutrition: { items: FoodItem[] } & Record<NutrientKey, number>;
};

export type PasteResult = { entries: ParsedFood[]; total: number } | { error: string };

// LLM replies are often wrapped in ```json fences; both the paste box and the chat strip them.
export function stripFences(text: string) {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

export function looksLikeJson(text: string) {
  const t = stripFences(text);
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

// Model output is untrusted: numbers can arrive as strings ("260", "30 g"). Anything that
// isn't a finite, non-negative number is dropped instead of being stored.
function amount(v: unknown): number | undefined {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function toItem(raw: unknown): FoodItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, any>;
  return {
    name: typeof r.name === 'string' ? r.name : 'Item',
    quantity: { value: amount(r.quantity?.value) ?? 0, unit: typeof r.quantity?.unit === 'string' ? r.quantity.unit : '' },
    macros: Object.fromEntries(NUTRIENT_KEYS.map(k => [k, amount(r.macros?.[k]) ?? 0])) as FoodItem['macros'],
  };
}

// One meal object from AI/pasted JSON -> addFood arguments. Null if it isn't in the meal format.
export function parseFoodJson(entryData: unknown, fallbackMeal: Meal): ParsedFood | null {
  if (!entryData || typeof entryData !== 'object' || Array.isArray(entryData)) return null;
  const d = entryData as Record<string, any>;
  if (!d.rawInput && !d.items && !d.totals) return null;

  const items = (Array.isArray(d.items) ? d.items : []).map(toItem).filter((i): i is FoodItem => i !== null);
  const totals = d.totals && typeof d.totals === 'object' ? d.totals : {};
  const nutrition = { items } as ParsedFood['nutrition'];
  for (const k of NUTRIENT_KEYS) {
    // ?? keeps a genuine 0 total instead of falling back to the item sum
    nutrition[k] = amount(totals[k]) ?? items.reduce((sum, item) => sum + (item.macros[k] ?? 0), 0);
  }

  let meal = fallbackMeal;
  if (d.mealType) {
    const m = String(d.mealType).toLowerCase();
    if (m.includes('breakfast')) meal = 'Breakfast';
    else if (m.includes('lunch')) meal = 'Lunch';
    else if (m.includes('snack')) meal = 'Snacks';
    else if (m.includes('dinner')) meal = 'Dinner';
  }

  const description = typeof d.rawInput === 'string' && d.rawInput.trim()
    ? d.rawInput.trim()
    : items.map(i => i.name).join(', ') || 'Meal';
  return { meal, description, nutrition };
}

// A block of text from the paste box or the chat. Null = not JSON, so the caller logs it as plain text.
export function parseFoodPaste(text: string, fallbackMeal: Meal): PasteResult | null {
  if (!looksLikeJson(text)) return null;
  let data: unknown;
  try {
    data = JSON.parse(stripFences(text));
  } catch {
    return { error: "Couldn't read that JSON. Check for a missing comma, quote or bracket." };
  }
  const list = Array.isArray(data) ? data : [data];
  const entries = list.map(d => parseFoodJson(d, fallbackMeal)).filter((e): e is ParsedFood => e !== null);
  if (!entries.length) return { error: "That JSON isn't in the meal format (it needs rawInput, items or totals)." };
  return { entries, total: list.length };
}

// The chat's final reply is the JSON; anything else is conversation.
export function extractFoodJson(text: string): ParsedFood[] | null {
  const result = parseFoodPaste(text, 'Lunch');
  return result && 'entries' in result ? result.entries : null;
}
