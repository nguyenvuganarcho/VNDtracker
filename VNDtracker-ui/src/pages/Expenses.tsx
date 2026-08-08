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
  Alert,
  CircularProgress,
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
import { useLanguage } from '../i18n';
import CategoryDot from '../components/CategoryDot';
import type { Category, Expense } from '../types';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  categoryId: '',
  amount: '',
  expenseDate: today(),
  note: '',
};

export default function Expenses() {
  const { t, formatCurrency, currencySymbol } = useLanguage();
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
      setError(t('failedLoadExpenses'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(editingId ? t('failedUpdateExpense') : t('failedAddExpense'));
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
      setError(t('failedDeleteExpense'));
    }
  };

  const categoryLabelById = (categoryId: number) => {
    const category = categories.find((c) => c.categoryId === categoryId);
    return category ? getCategoryLabel(category, t) : t('unknown');
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Exports exactly what's currently filtered/visible, not a separate re-fetch.
  const exportCsv = () => {
    const escapeCsvField = (field: string) => `"${field.replace(/"/g, '""')}"`;
    const headers = [t('date'), t('category'), t('amount'), t('note')];
    const rows = expenses.map((e) => [
      e.expenseDate.slice(0, 10),
      categoryLabelById(e.categoryId),
      String(e.amount),
      e.note || '',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
    // Leading BOM so Excel renders Vietnamese diacritics correctly instead of mojibake.
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vndtracker-expenses-${monthFilter || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 700 }}>
      <Typography variant="h4" gutterBottom>
        {t('expensesTitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label={t('month')}
          type="month"
          size="small"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="category-filter-label">{t('category')}</InputLabel>
          <Select
            labelId="category-filter-label"
            label={t('category')}
            value={categoryFilter}
            onChange={(e: SelectChangeEvent) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">{t('allCategories')}</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryDot categoryId={c.categoryId} size={8} />
                  {getCategoryLabel(c, t)}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {showForm ? (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {editingId ? t('editExpenseTitle') : t('addExpenseTitle')}
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label={`${t('amount')} (${currencySymbol})`}
                type="number"
                size="small"
                fullWidth
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                disabled={saving}
                autoFocus
              />
              <TextField
                label={t('date')}
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
              <InputLabel id="category-form-label">{t('category')}</InputLabel>
              <Select
                labelId="category-form-label"
                label={t('category')}
                value={form.categoryId}
                onChange={(e: SelectChangeEvent) => setForm({ ...form, categoryId: e.target.value })}
                disabled={saving}
              >
                {categories.map((c) => (
                  <MenuItem key={c.categoryId} value={String(c.categoryId)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryDot categoryId={c.categoryId} size={8} />
                      {getCategoryLabel(c, t)}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('note')}
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
                {editingId ? t('update') : t('add')}
              </Button>
              <Button variant="outlined" onClick={closeForm} disabled={saving}>
                {t('cancel')}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Button variant="contained" onClick={openAddForm} sx={{ mb: 3 }}>
          {t('addExpenseButton')}
        </Button>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">
              {t('total')}: {formatCurrency(total)}
            </Typography>
            <Button variant="outlined" size="small" onClick={exportCsv} disabled={expenses.length === 0}>
              {t('exportCsv')}
            </Button>
          </Stack>
          <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0, maxHeight: 480, overflowY: 'auto' }}>
            {expenses.length === 0 && (
              <ListItem>
                <ListItemText primary={t('noExpensesForFilter')} />
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
                <CategoryDot categoryId={expense.categoryId} />
                <ListItemText
                  sx={{ ml: 1.5 }}
                  primary={`${formatCurrency(expense.amount)} — ${categoryLabelById(expense.categoryId)}`}
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
