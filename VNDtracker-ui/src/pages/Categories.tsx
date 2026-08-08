import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import { useLanguage } from '../i18n';
import type { Category } from '../types';

export default function Categories() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadCategories = async () => {
    try {
      const res = await getCategoriesApi();
      setCategories(res.data);
    } catch {
      setError(t('failedLoadCategories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    setAdding(true);
    setError('');
    try {
      await createCategoryApi({ name });
      setNewName('');
      await loadCategories();
    } catch {
      setError(t('failedAddCategory'));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.categoryId);
    setEditValue(category.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (categoryId: number) => {
    const name = editValue.trim();
    if (!name) return;

    setError('');
    try {
      await updateCategoryApi(categoryId, { name });
      setEditingId(null);
      await loadCategories();
    } catch {
      setError(t('failedUpdateCategory'));
    }
  };

  const handleDelete = async (categoryId: number) => {
    setError('');
    try {
      await deleteCategoryApi(categoryId);
      await loadCategories();
    } catch {
      setError(t('failedDeleteCategory'));
    }
  };

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Typography variant="h4" gutterBottom>
        {t('categoriesTitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          label={t('newCategory')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={adding}
        />
        <Button variant="contained" onClick={handleAdd} disabled={adding || !newName.trim()}>
          {t('add')}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0 }}>
          {categories.map((category) => (
            <ListItem
              key={category.categoryId}
              divider
              secondaryAction={
                editingId === category.categoryId ? (
                  <>
                    <IconButton edge="end" onClick={() => saveEdit(category.categoryId)} aria-label="Save">
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={cancelEdit} aria-label="Cancel">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : category.isDefault ? (
                  <Chip label={t('default')} size="small" variant="outlined" />
                ) : (
                  <>
                    <IconButton edge="end" onClick={() => startEdit(category)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(category.categoryId)} aria-label="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )
              }
            >
              {editingId === category.categoryId ? (
                <TextField
                  fullWidth
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(category.categoryId)}
                  autoFocus
                />
              ) : (
                <ListItemText primary={getCategoryLabel(category, t)} />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
