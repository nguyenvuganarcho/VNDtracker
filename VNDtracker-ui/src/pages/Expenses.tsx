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
  Alert,
  CircularProgress,
  Link,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getExpensesApi, createExpenseApi, updateExpenseApi, deleteExpenseApi } from '../api/expense';
import { getCategoriesApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import type { Category, Expense } from '../types';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const formatAmount = (amount: number) => `${amount.toLocaleString('en-US')} ₫`;

const emptyForm = {
  categoryId: '',
  amount: '',
  expenseDate: today(),
  note: '',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [categoryFilter, setCategoryFilter] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadCategories = async () => {
    const res = await getCategoriesApi();
    setCategories(res.data);
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await getExpensesApi({
        month: monthFilter || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
      });
      setExpenses(res.data);
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, categoryFilter]);

  // Prefill category from the active filter — if you're looking at "Food & Drink"
  // and hit add, you almost certainly want another "Food & Drink" expense, not a
  // second, separate category prompt.
  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categoryFilter });
    setShowForm(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount || !form.expenseDate) return;

    setSaving(true);
    setError('');
    try {
      const dto = {
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        note: form.note.trim() || undefined,
      };

      if (editingId) {
        await updateExpenseApi(editingId, dto);
        closeForm();
      } else {
        await createExpenseApi(dto);
        // Stay open for quick consecutive entries, keep the prefilled category.
        setForm({ ...emptyForm, categoryId: form.categoryId });
      }

      await loadExpenses();
    } catch {
      setError(editingId ? 'Failed to update expense' : 'Failed to add expense');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.expenseId);
    setForm({
      categoryId: String(expense.categoryId),
      amount: String(expense.amount),
      expenseDate: expense.expenseDate.slice(0, 10),
      note: expense.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (expenseId: number) => {
    setError('');
    try {
      await deleteExpenseApi(expenseId);
      if (editingId === expenseId) closeForm();
      await loadExpenses();
    } catch {
      setError('Failed to delete expense');
    }
  };

  const categoryLabelById = (categoryId: number) => {
    const category = categories.find((c) => c.categoryId === categoryId);
    return category ? getCategoryLabel(category) : 'Unknown';
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Box sx={{ p: 4, maxWidth: 600 }}>
      <Link component={RouterLink} to="/" variant="body2">
        Back
      </Link>

      <Typography variant="h4" gutterBottom sx={{ mt: 2 }}>
        Expenses
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Month"
          type="month"
          size="small"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select
            labelId="category-filter-label"
            label="Category"
            value={categoryFilter}
            onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                {getCategoryLabel(c)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {showForm ? (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {editingId ? 'Edit expense' : 'Add expense'}
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Amount (₫)"
                type="number"
                size="small"
                fullWidth
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                disabled={saving}
                autoFocus
              />
              <TextField
                label="Date"
                type="date"
                size="small"
                fullWidth
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={saving}
              />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel id="category-form-label">Category</InputLabel>
              <Select
                labelId="category-form-label"
                label="Category"
                value={form.categoryId}
                onChange={(e: SelectChangeEvent) => setForm({ ...form, categoryId: e.target.value })}
                disabled={saving}
              >
                {categories.map((c) => (
                  <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                    {getCategoryLabel(c)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Note (optional)"
              size="small"
              fullWidth
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={saving}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={saving || !form.categoryId || !form.amount || !form.expenseDate}
              >
                {editingId ? 'Update' : 'Add'}
              </Button>
              <Button variant="outlined" onClick={closeForm} disabled={saving}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Button variant="contained" onClick={openAddForm} sx={{ mb: 3 }}>
          + Add expense
        </Button>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Total: {formatAmount(total)}
          </Typography>
          <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0 }}>
            {expenses.length === 0 && (
              <ListItem>
                <ListItemText primary="No expenses for this filter" />
              </ListItem>
            )}
            {expenses.map((expense) => (
              <ListItem
                key={expense.expenseId}
                divider
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => startEdit(expense)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(expense.expenseId)} aria-label="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={`${formatAmount(expense.amount)} — ${categoryLabelById(expense.categoryId)}`}
                  secondary={`${expense.expenseDate.slice(0, 10)}${expense.note ? ' — ' + expense.note : ''}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}
