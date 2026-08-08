// Deterministic, muted accent color per category -- no user picker, no DB
// column touched. Just enough color to make lists scannable without
// abandoning the black/white base theme (used only as small dots/chips).
const PALETTE = [
  '#5C6BC0', // indigo
  '#26A69A', // teal
  '#EF6C00', // amber
  '#8D6E63', // brown
  '#7CB342', // green
  '#AB47BC', // purple
  '#EC407A', // pink
  '#546E7A', // blue grey
];

export const getCategoryColor = (categoryId: number): string => PALETTE[categoryId % PALETTE.length];
