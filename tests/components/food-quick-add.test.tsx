import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FoodQuickAdd } from '@/components/QuickAdds';

const meal = { rawInput: '4 idlis', mealType: 'Breakfast', totals: { calories: 260, protein: 8 } };

function setup() {
  const onAdd = vi.fn();
  render(<FoodQuickAdd onAdd={onAdd} />);
  return { onAdd, box: screen.getByLabelText('Meal description or JSON'), user: userEvent.setup() };
}

describe('FoodQuickAdd (paste box)', () => {
  it('F-07: logs a fenced LLM reply as a meal', async () => {
    const { onAdd, box, user } = setup();
    await user.click(box);
    await user.paste('```json\n' + JSON.stringify(meal) + '\n```');
    expect(screen.getByText('JSON DETECTED')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add meal' }));
    expect(onAdd).toHaveBeenCalledWith('Breakfast', '4 idlis', expect.objectContaining({ calories: 260, protein: 8 }));
    expect(box).toHaveValue('');
  });

  it('F-07: keeps broken JSON in the box and explains, instead of logging it', async () => {
    const { onAdd, box, user } = setup();
    const broken = '{"rawInput":"x","totals":{"calories":260,}}';
    await user.click(box);
    await user.paste(broken);
    await user.click(screen.getByRole('button', { name: 'Add meal' }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent("Couldn't read that JSON");
    expect(box).toHaveValue(broken);
  });

  it('F-07: says how many meals of an array were logged', async () => {
    const { onAdd, box, user } = setup();
    await user.click(box);
    await user.paste(JSON.stringify([meal, { foo: 1 }]));
    await user.click(screen.getByRole('button', { name: 'Add meal' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent("Logged 1 of 2. 1 wasn't in the meal format.");
  });

  it('still logs plain text with the manual macros', async () => {
    const { onAdd, box, user } = setup();
    await user.type(box, '2 rotis and dal');
    await user.click(screen.getByRole('button', { name: 'Add meal' }));
    expect(onAdd).toHaveBeenCalledWith('Lunch', '2 rotis and dal', { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  });
});
