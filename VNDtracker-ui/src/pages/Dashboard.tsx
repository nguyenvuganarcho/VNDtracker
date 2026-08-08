import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PieChart } from '@mui/x-charts/PieChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { getExpensesApi } from '../api/expense';
import { getCategoriesApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import { getCategoryColor } from '../utils/categoryColor';
import CategoryDot from '../components/CategoryDot';
import { useLanguage } from '../i18n';
import type { Category, Expense } from '../types';

type HealthStatus = 'checking' | 'ok' | 'unreachable';

const HEALTH_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '/health');

const currentMonth = () => new Date().toISOString().slice(0, 7);

interface CategoryBreakdown {
  categoryId: number;
  label: string;
  amount: number;
}

export default function Dashboard() {
  const { t, formatCurrency } = useLanguage();
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(HEALTH_URL)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unreachable'));
  }, []);

  useEffect(() => {
    Promise.all([getExpensesApi({ month: currentMonth() }), getCategoriesApi()])
      .then(([expensesRes, categoriesRes]) => {
        setExpenses(expensesRes.data);
        setCategories(categoriesRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const categoryLabelById = (categoryId: number) => {
    const category = categories.find((c) => c.categoryId === categoryId);
    return category ? getCategoryLabel(category, t) : t('unknown');
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const breakdown: CategoryBreakdown[] = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.categoryId]) {
        acc[e.categoryId] = { categoryId: e.categoryId, label: categoryLabelById(e.categoryId), amount: 0 };
      }
      acc[e.categoryId].amount += e.amount;
      return acc;
    }, {} as Record<number, CategoryBreakdown>)
  ).sort((a, b) => b.amount - a.amount);

  const recentExpenses = [...expenses]
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Typography variant="h6" gutterBottom>
        {t('thisMonth')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : expenses.length === 0 ? (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            {t('noExpensesThisMonth')}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('getStartedNote')}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
            <Button variant="contained" component={RouterLink} to="/expenses">
              {t('addExpenseButton')}
            </Button>
            <Button variant="outlined" component={RouterLink} to="/scan">
              {t('scanReceipt')}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box sx={{ flex: '1 1 420px', minWidth: 0 }}>
            <Typography variant="h3" gutterBottom>
              {formatCurrency(total)}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: breakdown.map((b) => ({
                      id: b.categoryId,
                      value: b.amount,
                      label: b.label,
                      color: getCategoryColor(b.categoryId),
                    })),
                    innerRadius: 40,
                  },
                ]}
                width={380}
                height={240}
              />
            </Box>

            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mt: 2 }}>
              {breakdown.map((b, i) => (
                <Box
                  key={b.categoryId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    borderTop: i === 0 ? 'none' : '1px solid #e0e0e0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryDot categoryId={b.categoryId} />
                    <Typography variant="body2">{b.label}</Typography>
                  </Box>
                  <Typography variant="body2">{formatCurrency(b.amount)}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ flex: '1 1 320px', minWidth: 0 }}>
            <Typography variant="h6" gutterBottom>
              {t('recentExpenses')}
            </Typography>
            <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0 }}>
              {recentExpenses.map((expense) => (
                <ListItem key={expense.expenseId} divider>
                  <CategoryDot categoryId={expense.categoryId} />
                  <ListItemText
                    sx={{ ml: 1.5 }}
                    primary={`${formatCurrency(expense.amount)} — ${categoryLabelById(expense.categoryId)}`}
                    secondary={expense.expenseDate.slice(0, 10)}
                  />
                </ListItem>
              ))}
            </List>
            <Link component={RouterLink} to="/expenses" variant="body2" sx={{ mt: 1, display: 'inline-block' }}>
              {t('viewAll')}
            </Link>
          </Box>
        </Stack>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        {t('backendStatus')}
      </Typography>
      <Chip
        label={status === 'checking' ? t('checking') : status === 'ok' ? t('connected') : t('unreachable')}
        color={status === 'ok' ? 'success' : status === 'unreachable' ? 'error' : 'default'}
        size="small"
      />
    </Box>
  );
}
