import type { Category } from '../types';

// English display names for default category keys. Placeholder until the
// i18n feature (FR-9.x) wires this into en.json/vi.json with a language
// switcher — same nameKeys will be reused there.
const defaultCategoryLabels: Record<string, string> = {
  food: 'Food & Drink',
  transport: 'Transport',
  bills: 'Bills & Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  other: 'Other',
};

export const getCategoryLabel = (category: Pick<Category, 'name' | 'nameKey'>): string => {
  if (category.name) {
    return category.name;
  }
  if (category.nameKey) {
    return defaultCategoryLabels[category.nameKey] || category.nameKey;
  }
  return 'Unnamed';
};
