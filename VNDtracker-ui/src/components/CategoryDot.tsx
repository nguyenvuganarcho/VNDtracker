import Box from '@mui/material/Box';
import { getCategoryColor } from '../utils/categoryColor';

export default function CategoryDot({ categoryId, size = 10 }: { categoryId: number; size?: number }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: getCategoryColor(categoryId),
        flexShrink: 0,
      }}
    />
  );
}
