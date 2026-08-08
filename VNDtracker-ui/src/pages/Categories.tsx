import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Link,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import type { Category } from '../types';

export default function Categories() {
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
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
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
      setError('Failed to add category');
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
      setError('Failed to update category');
    }
  };

  const handleDelete = async (categoryId: number) => {
    setError('');
    try {
      await deleteCategoryApi(categoryId);
      await loadCategories();
    } catch {
      setError('Failed to delete category');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 500 }}>
      <Link component={RouterLink} to="/" variant="body2">
        Back
      </Link>

      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Categories
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
          label="New category"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          disabled={adding}
        />
        <Button variant="contained" onClick={handleAdd} disabled={adding || !newName.trim()}>
          Add
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
                  <Chip label="Default" size="small" variant="outlined" />
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
                <ListItemText primary={getCategoryLabel(category)} />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
