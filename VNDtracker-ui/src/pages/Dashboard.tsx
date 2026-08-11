import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Link as RouterLink } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
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

// isoWeek pins the week to Mon-Sun regardless of locale -- dayjs's default
// startOf('week') is Sunday under the English locale and Monday under vi,
// which would silently shift "this week" when the user switches language.
dayjs.extend(isoWeek);

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

  // W2 -- today's total/count, plus a 14-day sparkline. Both read from
  // trendExpenses (not the current-month-only `expenses`) so the sparkline
  // and "today" figure stay correct even when today falls in the first few
  // days of a new month.
  const todayStr = today();
  const todayExpenses = trendExpenses.filter((e) => e.expenseDate === todayStr);
  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalByDate = (date: string) =>
    trendExpenses.filter((e) => e.expenseDate === date).reduce((sum, e) => sum + e.amount, 0);

  // W2 + W3 share the same rolling-7-day window (ending today, not the ISO
  // calendar week -- that alignment is for the weekly-budget widgets
  // instead) so both charts agree on which day is which.
  const last7Days = Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day'));
  const last7Totals = last7Days.map((d) => totalByDate(d.format('YYYY-MM-DD')));
  const last7Labels = last7Days.map((d) => d.locale(language).format('dd'));
  const last7Average = last7Totals.reduce((sum, v) => sum + v, 0) / 7;

  // W1/W4 use the ISO week (Mon-Sun) rather than the rolling 7-day window
  // above: "left this week" only makes sense against a week that actually
  // ends, and it resets on Monday like the user's own sense of the week.
  const weekStart = dayjs().startOf('isoWeek');
  const weekEnd = dayjs().endOf('isoWeek');
  const thisWeekExpenses = trendExpenses.filter((e) => {
    const d = dayjs(e.expenseDate);
    return !d.isBefore(weekStart, 'day') && !d.isAfter(weekEnd, 'day');
  });
  const thisWeekTotal = thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Proration, not a stored weekly limit -- the budgets table only holds a
  // standing monthly figure, so this is an honest approximation and the
  // label says so. A real weekly cadence needs a schema change.
  const weeklyBudget = overallBudget
    ? (overallBudget.limitAmount * 7) / dayjs().daysInMonth()
    : null;
  const weekLeft = weeklyBudget !== null ? weeklyBudget - thisWeekTotal : null;

  const weekBreakdown: CategoryBreakdown[] = Object.values(
    thisWeekExpenses.reduce((acc, e) => {
      if (!acc[e.categoryId]) {
        acc[e.categoryId] = { categoryId: e.categoryId, label: categoryLabelById(e.categoryId), amount: 0 };
      }
      acc[e.categoryId].amount += e.amount;
      return acc;
    }, {} as Record<number, CategoryBreakdown>)
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // W6 -- only categories with a budget that are >=60% consumed this month.
  // Everything comfortably green stays hidden: silence is the signal.
  const watchList = budgets
    .filter((b) => b.categoryId !== null)
    .map((b) => {
      const spent = breakdown.find((c) => c.categoryId === b.categoryId)?.amount || 0;
      return { budget: b, spent, ratio: spent / b.limitAmount };
    })
    .filter((row) => row.ratio >= 0.6)
    .sort((a, b) => b.ratio - a.ratio);

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

            {/* W1 -- safe-to-spend. Deliberately not a chart: one number
                answers the question faster than any visualization. */}
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
              {weeklyBudget !== null && weekLeft !== null ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle2">
                      {weekLeft >= 0 ? t('leftThisWeek') : t('overBy')}
                    </Typography>
                    <Link component={RouterLink} to="/budgets" variant="body2">
                      {t('viewBudgets')}
                    </Link>
                  </Box>
                  <Typography variant="h4" color={weekLeft >= 0 ? 'text.primary' : 'error'} gutterBottom>
                    {formatCurrency(Math.round(Math.abs(weekLeft)))}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((thisWeekTotal / weeklyBudget) * 100, 100)}
                    color={
                      weekLeft < 0 ? 'error' : thisWeekTotal / weeklyBudget >= 0.8 ? 'warning' : 'success'
                    }
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                    {formatCurrency(thisWeekTotal)} / {formatCurrency(Math.round(weeklyBudget))} ·{' '}
                    {t('fromMonthlyBudget')}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('setBudgetCta')}
                  </Typography>
                  <Button size="small" variant="outlined" component={RouterLink} to="/budgets">
                    {t('budgetsTitle')}
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {/* W2 -- today strip. Shares last7Days/last7Labels with W3 below
              so both charts agree on which point is which day -- a bare
              axis-less sparkline here made it impossible to tell days apart. */}
          <Box>
            <Typography variant="body1" gutterBottom>
              {t('today')}: {formatCurrency(todayTotal)} · {todayExpenses.length}{' '}
              {todayExpenses.length === 1 ? t('item') : t('items')}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <LineChart
                xAxis={[{ scaleType: 'point', data: last7Labels }]}
                yAxis={[{ width: 0 }]}
                series={[{ data: last7Totals, color: '#000000', area: true, showMark: false }]}
                height={90}
                margin={{ top: 8, bottom: 20, left: 16, right: 16 }}
              />
            </Box>
          </Box>

          {/* W3 -- last 7 days */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('last7Days')} · {t('avgLabel')} {formatCurrency(Math.round(last7Average))}
            </Typography>
            <Box sx={{ width: '100%' }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: last7Labels }]}
                series={[{ data: last7Totals, color: '#000000', valueFormatter: (v) => formatCurrency(v ?? 0) }]}
                height={180}
              >
                <ChartsReferenceLine y={last7Average} lineStyle={{ strokeDasharray: '4 4' }} />
              </BarChart>
            </Box>
          </Box>

          {/* W4 -- this week by category. Horizontal bars beat the old pie
              on a phone: labels sit readably at line-start, and comparing
              lengths is easier than comparing angles -- especially with the
              2-3 categories a light user actually produces. */}
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('thisWeekByCategory')}
            </Typography>
            {weekBreakdown.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('noSpendThisWeek')}
              </Typography>
            ) : (
              <Box sx={{ width: '100%' }}>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: 'band', data: weekBreakdown.map((b) => b.label), width: 100 }]}
                  series={[
                    {
                      data: weekBreakdown.map((b) => b.amount),
                      valueFormatter: (v) => formatCurrency(v ?? 0),
                    },
                  ]}
                  colors={weekBreakdown.map((b) => getCategoryColor(b.categoryId))}
                  height={Math.max(120, weekBreakdown.length * 48)}
                />
              </Box>
            )}
          </Box>

          {/* W6 -- budget watch list, compressed. Only categories at >=60%
              of their limit appear; everything green stays behind the link,
              so rendering nothing here is the healthy state, not a gap. */}
          {watchList.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h6">{t('budgetHealth')}</Typography>
                <Link component={RouterLink} to="/budgets" variant="body2">
                  {t('viewBudgets')}
                </Link>
              </Box>
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, px: 2, py: 1.5 }}>
                {watchList.map((row, i) => (
                  <Box key={row.budget.budgetId} sx={{ mt: i === 0 ? 0 : 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CategoryDot categoryId={row.budget.categoryId!} />
                        <Typography variant="body2">{categoryLabelById(row.budget.categoryId!)}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(row.spent)} / {formatCurrency(row.budget.limitAmount)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(row.ratio * 100, 100)}
                      color={row.ratio > 1 ? 'error' : 'warning'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

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
