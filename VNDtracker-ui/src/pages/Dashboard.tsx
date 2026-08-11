import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Link as RouterLink } from 'react-router-dom';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getExpensesApi } from '../api/expense';
import { getCategoriesApi } from '../api/category';
import { getBudgetsApi } from '../api/budget';
import { getCategoryLabel } from '../utils/categoryLabels';
import { getCategoryColor } from '../utils/categoryColor';
import { localCurrentMonth, localToday } from '../utils/date';
import CategoryDot from '../components/CategoryDot';
import { useLanguage } from '../i18n';
import type { Budget, Category, Expense } from '../types';

const currentMonth = localCurrentMonth;
const today = localToday;

// Last 6 months as "YYYY-MM" labels, oldest first, always including the
// current month even if it has no expenses yet.
const last6Months = (): string[] => {
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    months.push(dayjs().subtract(i, 'month').format('YYYY-MM'));
  }
  return months;
};

const sixMonthsAgoStart = () => dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD');

interface CategoryBreakdown {
  categoryId: number;
  label: string;
  amount: number;
}

interface DayGroup {
  date: string;
  total: number;
  items: Expense[];
}

export default function Dashboard() {
  const { t, language, formatCurrency } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendExpenses, setTrendExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getExpensesApi({ month: currentMonth() }),
      getCategoriesApi(),
      getExpensesApi({ startDate: sixMonthsAgoStart(), endDate: today() }),
      getBudgetsApi(),
    ])
      .then(([expensesRes, categoriesRes, trendRes, budgetsRes]) => {
        setExpenses(expensesRes.data);
        setCategories(categoriesRes.data);
        setTrendExpenses(trendRes.data);
        setBudgets(budgetsRes.data);
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

  const overallBudget = budgets.find((b) => b.categoryId === null);
  const overBudgetCount = budgets.filter((b) => {
    if (b.categoryId === null) return false;
    const spent = breakdown.find((c) => c.categoryId === b.categoryId)?.amount || 0;
    return spent > b.limitAmount;
  }).length;

  // W2 -- today's total/count, plus a 14-day sparkline. Both read from
  // trendExpenses (not the current-month-only `expenses`) so the sparkline
  // and "today" figure stay correct even when today falls in the first few
  // days of a new month.
  const todayStr = today();
  const todayExpenses = trendExpenses.filter((e) => e.expenseDate === todayStr);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalByDate = (date: string) =>
    trendExpenses.filter((e) => e.expenseDate === date).reduce((sum, e) => sum + e.amount, 0);
  const last14Totals = Array.from({ length: 14 }, (_, i) =>
    totalByDate(dayjs().subtract(13 - i, 'day').format('YYYY-MM-DD'))
  );

  // W3 -- rolling last 7 days ending today (not the ISO calendar week --
  // that alignment is used by the weekly-budget widgets instead).
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day'));
  const last7Totals = last7Days.map((d) => totalByDate(d.format('YYYY-MM-DD')));
  const last7Labels = last7Days.map((d) => d.locale(language).format('dd'));
  const last7Average = last7Totals.reduce((sum, v) => sum + v, 0) / 7;

  // W5 -- last 7 *days that have entries* (not 7 calendar slots), most
  // recent first, each with its own subtotal.
  const recentGrouped: DayGroup[] = Object.entries(
    trendExpenses.reduce((acc, e) => {
      (acc[e.expenseDate] ??= []).push(e);
      return acc;
    }, {} as Record<string, Expense[]>)
  )
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, items]) => ({
      date,
      total: items.reduce((sum, e) => sum + e.amount, 0),
      items: [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }));

  const monthLabels = last6Months();
  const monthTotals = trendExpenses.reduce((acc, e) => {
    const month = e.expenseDate.slice(0, 7);
    acc[month] = (acc[month] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  const trendValues = monthLabels.map((m) => monthTotals[m] || 0);
  const trendLabels = monthLabels.map((m) => {
    const [y, mo] = m.split('-').map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      year: '2-digit',
    });
  });

  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: 640 }, mx: 'auto' }}>
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
        <Stack spacing={3}>
          <Box>
            <Typography variant="h3" gutterBottom>
              {formatCurrency(total)}
            </Typography>

            {(overallBudget || overBudgetCount > 0) && (
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2">{t('budgetOverview')}</Typography>
                  <Link component={RouterLink} to="/budgets" variant="body2">
                    {t('viewBudgets')}
                  </Link>
                </Box>
                {overallBudget && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatCurrency(total)} / {formatCurrency(overallBudget.limitAmount)}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((total / overallBudget.limitAmount) * 100, 100)}
                      color={
                        total > overallBudget.limitAmount
                          ? 'error'
                          : total / overallBudget.limitAmount >= 0.8
                            ? 'warning'
                            : 'success'
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </>
                )}
                {overBudgetCount > 0 && (
                  <Typography variant="body2" color="error" sx={{ mt: overallBudget ? 1 : 0 }}>
                    {t('categoriesOverBudget')}: {overBudgetCount}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* W2 -- today strip */}
          <Box>
            <Typography variant="body1" gutterBottom>
              {t('today')}: {formatCurrency(todayTotal)} · {todayExpenses.length}{' '}
              {todayExpenses.length === 1 ? t('item') : t('items')}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <SparkLineChart data={last14Totals} plotType="line" area height={40} color="#000000" />
            </Box>
          </Box>

          {/* W3 -- last 7 days */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('last7Days')}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: last7Labels }]}
                series={[{ data: last7Totals, color: '#000000', valueFormatter: (v) => formatCurrency(v ?? 0) }]}
                height={180}
              >
                <ChartsReferenceLine
                  y={last7Average}
                  label={`${t('avgLabel')} ${formatCurrency(Math.round(last7Average))}`}
                  labelStyle={{ fontSize: 11 }}
                  lineStyle={{ strokeDasharray: '4 4' }}
                />
              </BarChart>
            </Box>
          </Box>

          {/* Category breakdown (pie) -- widget W4 replaces this in the next PR */}
          <Box>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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

          {/* W5 -- recent, grouped by day */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('recentExpenses')}
            </Typography>
            <List sx={{ border: '1px solid #e0e0e0', borderRadius: 2, py: 0 }}>
              {recentGrouped.map((group) => (
                <Box key={group.date}>
                  <Box sx={{ px: 2, py: 1, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(group.date).locale(language).format('ddd D MMM')} — {formatCurrency(group.total)}
                    </Typography>
                  </Box>
                  {group.items.map((expense) => (
                    <ListItem key={expense.expenseId} divider>
                      <CategoryDot categoryId={expense.categoryId} />
                      <ListItemText
                        sx={{ ml: 1.5 }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {formatCurrency(expense.amount)} — {categoryLabelById(expense.categoryId)}
                            {expense.source === 'ai' && (
                              <AutoAwesomeIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                            )}
                          </Box>
                        }
                        secondary={expense.note || undefined}
                      />
                    </ListItem>
                  ))}
                </Box>
              ))}
            </List>
            <Link component={RouterLink} to="/expenses" variant="body2" sx={{ mt: 1, display: 'inline-block' }}>
              {t('viewAll')}
            </Link>
          </Box>

          {/* 6-month trend */}
          <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {t('spendingTrend')}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <LineChart
                xAxis={[{ scaleType: 'point', data: trendLabels }]}
                series={[{ data: trendValues, color: '#000000', valueFormatter: (v) => formatCurrency(v ?? 0) }]}
                height={220}
              />
            </Box>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
