import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { getBudgetsApi, upsertBudgetApi, deleteOverallBudgetApi, deleteCategoryBudgetApi } from '../api/budget';
import { getCategoriesApi } from '../api/category';
import { getExpensesApi } from '../api/expense';
import { getCategoryLabel } from '../utils/categoryLabels';
import { localCurrentMonth } from '../utils/date';
import CategoryDot from '../components/CategoryDot';
import { useLanguage } from '../i18n';
import type { Budget, Category, Expense } from '../types';

const currentMonth = localCurrentMonth;

// Sentinel key for the overall (categoryId null) row -- Record keys must be
// strings, and "null" as a literal string would be ambiguous with a real
// category id, so a distinct word is used instead.
const OVERALL_KEY = 'overall';

export default function Budgets() {
  const { t, formatCurrency } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const [catRes, budgetRes, expRes] = await Promise.all([
        getCategoriesApi(),
        getBudgetsApi(),
        getExpensesApi({ month: currentMonth() }),
      ]);
      setCategories(catRes.data);
      setBudgets(budgetRes.data);
      setExpenses(expRes.data);
    } catch {
      setError(t('failedLoadBudgets'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keyFor = (categoryId: number | null) => (categoryId === null ? OVERALL_KEY : String(categoryId));
  const budgetFor = (categoryId: number | null) => budgets.find((b) => b.categoryId === categoryId);
  const spentFor = (categoryId: number | null) =>
    expenses
      .filter((e) => categoryId === null || e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);

  const inputValue = (categoryId: number | null) => {
    const key = keyFor(categoryId);
    if (key in inputs) return inputs[key];
    return budgetFor(categoryId)?.limitAmount.toString() || '';
  };

  const handleSave = async (categoryId: number | null) => {
    const raw = inputValue(categoryId);
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) return;

    setError('');
    try {
      await upsertBudgetApi({ categoryId, limitAmount: amount });
      const key = keyFor(categoryId);
      setInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await load();
    } catch {
      setError(t('failedSaveBudget'));
    }
  };

  const handleDelete = async (categoryId: number | null) => {
    setError('');
    try {
      if (categoryId === null) {
        await deleteOverallBudgetApi();
      } else {
        await deleteCategoryBudgetApi(categoryId);
      }
      await load();
    } catch {
      setError(t('failedDeleteBudget'));
    }
  };

  const renderRow = (categoryId: number | null, label: React.ReactNode) => {
    const budget = budgetFor(categoryId);
    const spent = spentFor(categoryId);
    const limit = budget?.limitAmount;
    const ratio = limit ? Math.min(spent / limit, 1) : 0;
    const over = limit ? spent > limit : false;
    const near = limit ? spent / limit >= 0.8 && !over : false;
    const barColor = over ? 'error' : near ? 'warning' : 'success';

    return (
      <ListItem key={keyFor(categoryId)} divider sx={{ flexDirection: 'column', alignItems: 'stretch', py: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{label}</Box>
          <Typography variant="body2" color="text.secondary">
            {limit ? `${formatCurrency(spent)} / ${formatCurrency(limit)}` : t('noLimitSet')}
          </Typography>
        </Box>

        {limit ? (
          <LinearProgress
            variant="determinate"
            value={ratio * 100}
            color={barColor}
            sx={{ height: 6, borderRadius: 3 }}
          />
        ) : null}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            type="number"
            label={t('limitAmount')}
            value={inputValue(categoryId)}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, [keyFor(categoryId)]: e.target.value }))
            }
            sx={{ maxWidth: 200 }}
          />
          <IconButton onClick={() => handleSave(categoryId)} aria-label="Save" size="small">
            <CheckIcon fontSize="small" />
          </IconButton>
          {budget ? (
            <IconButton onClick={() => handleDelete(categoryId)} aria-label="Delete" size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('budgetsTitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0 }}>
          {renderRow(
            null,
            <Typography variant="body1" fontWeight={600}>
              {t('overallBudget')}
            </Typography>
          )}
          {categories.map((c) =>
            renderRow(
              c.categoryId,
              <>
                <CategoryDot categoryId={c.categoryId} />
                <Typography variant="body1">{getCategoryLabel(c, t)}</Typography>
              </>
            )
          )}
        </List>
      )}
    </Box>
  );
}
