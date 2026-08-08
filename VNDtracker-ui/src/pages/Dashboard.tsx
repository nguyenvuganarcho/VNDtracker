import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { PieChart } from '@mui/x-charts/PieChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { getUser, removeToken } from '../utils/auth';
import { getExpensesApi } from '../api/expense';
import { getCategoriesApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import type { Category, Expense } from '../types';

type HealthStatus = 'checking' | 'ok' | 'unreachable';

const HEALTH_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '/health');

const currentMonth = () => new Date().toISOString().slice(0, 7);
const formatAmount = (amount: number) => `${amount.toLocaleString('en-US')} ₫`;

interface CategoryBreakdown {
  categoryId: number;
  label: string;
  amount: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

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

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const breakdown: CategoryBreakdown[] = Object.values(
    expenses.reduce((acc, e) => {
      if (!acc[e.categoryId]) {
        const category = categories.find((c) => c.categoryId === e.categoryId);
        acc[e.categoryId] = {
          categoryId: e.categoryId,
          label: category ? getCategoryLabel(category) : 'Unknown',
          amount: 0,
        };
      }
      acc[e.categoryId].amount += e.amount;
      return acc;
    }, {} as Record<number, CategoryBreakdown>)
  ).sort((a, b) => b.amount - a.amount);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        VNDtracker
      </Typography>
      <Typography variant="body1" gutterBottom>
        Signed in as {user?.name} ({user?.email})
      </Typography>
      <Button variant="outlined" size="small" onClick={handleLogout} sx={{ mb: 3 }}>
        Logout
      </Button>
      <Typography variant="body1" gutterBottom>
        <Link component={RouterLink} to="/expenses">
          Expenses
        </Link>
        {' · '}
        <Link component={RouterLink} to="/categories">
          Manage categories
        </Link>
      </Typography>

      <Box sx={{ mt: 4, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          This month
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : expenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No expenses yet this month.
          </Typography>
        ) : (
          <>
            <Typography variant="h3" gutterBottom>
              {formatAmount(total)}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: breakdown.map((b) => ({ id: b.categoryId, value: b.amount, label: b.label })),
                    innerRadius: 40,
                  },
                ]}
                width={400}
                height={240}
              />
            </Box>

            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mt: 2 }}>
              {breakdown.map((b, i) => (
                <Box
                  key={b.categoryId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                    borderTop: i === 0 ? 'none' : '1px solid #e0e0e0',
                  }}
                >
                  <Typography variant="body2">{b.label}</Typography>
                  <Typography variant="body2">{formatAmount(b.amount)}</Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        Backend connection status:
      </Typography>
      <Chip
        label={status === 'checking' ? 'Checking...' : status === 'ok' ? 'Connected' : 'Unreachable'}
        color={status === 'ok' ? 'success' : status === 'unreachable' ? 'error' : 'default'}
        size="small"
      />
    </Box>
  );
}
