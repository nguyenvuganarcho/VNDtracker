import type { Category } from '../types';

export const getCategoryLabel = (
  category: Pick<Category, 'name' | 'nameKey'>,
  t: (key: string) => string
): string => {
  if (category.name) {
    return category.name;
  }
  if (category.nameKey) {
    return t(`category_${category.nameKey}`);
  }
  return t('unknown');
};
