import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import type { SelectChangeEvent } from '@mui/material';
import { scanReceiptApi } from '../api/ai';
import { createExpenseApi } from '../api/expense';
import { getCategoriesApi } from '../api/category';
import { getCategoryLabel } from '../utils/categoryLabels';
import { useLanguage } from '../i18n';
import CategoryDot from '../components/CategoryDot';
import type { Category, ScanReceiptResult } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = { categoryId: '', amount: '', expenseDate: today(), note: '' };

export default function ScanReceipt() {
  const navigate = useNavigate();
  const { t, language, currencySymbol } = useLanguage();

  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanReceiptResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    getCategoriesApi().then((res) => setCategories(res.data));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setScanResult(null);
    setError('');
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  };

  const handleScan = async () => {
    if (!file) return;

    setScanning(true);
    setError('');
    try {
      const res = await scanReceiptApi(file);
      const result = res.data;
      setScanResult(result);
      setForm({
        categoryId: result.categoryId ? String(result.categoryId) : '',
        amount: result.amount ? String(result.amount) : '',
        expenseDate: result.expenseDate || today(),
        note: result.note || '',
      });
      // Treat "no usable amount" the same as a hard AI failure -- a tool
      // call that technically succeeded but couldn't find an amount is
      // just as unusable to the user as one that errored outright.
      if (!result.aiReadable || !result.amount) {
        setError(t('scanAiFailedNote'));
      }
    } catch {
      setError(t('failedScan'));
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!scanResult || !form.categoryId || !form.amount || !form.expenseDate) return;

    setSaving(true);
    setError('');
    try {
      await createExpenseApi({
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        note: form.note.trim() || undefined,
        source: 'ai',
        inputType: scanResult.inputType || undefined,
        receiptImagePath: scanResult.receiptImagePath,
      });
      navigate('/expenses');
    } catch {
      setError(t('failedAddExpense'));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError('');
    setForm(emptyForm);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('scanReceipt')}
      </Typography>

      {error && (
        <Alert
          severity={scanResult && !scanResult.aiReadable ? 'warning' : 'error'}
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {!scanResult ? (
        <Stack spacing={2}>
          <Button variant="outlined" component="label">
            {t('chooseImage')}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFileChange} />
          </Button>

          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt=""
              sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, border: '1px solid #e0e0e0' }}
            />
          )}

          <Button variant="contained" onClick={handleScan} disabled={!file || scanning}>
            {scanning ? <CircularProgress size={20} color="inherit" /> : t('scanButton')}
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt=""
              sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, border: '1px solid #e0e0e0' }}
            />
          )}

          {scanResult.aiReadable && scanResult.amount && scanResult.inputType && (
            <Chip
              label={scanResult.inputType === 'bill' ? t('billType') : t('transferType')}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label={`${t('amount')} (${currencySymbol})`}
              type="number"
              size="small"
              fullWidth
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={saving}
            />
            <TextField
              label={t('date')}
              type="date"
              size="small"
              fullWidth
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ lang: language === 'vi' ? 'vi-VN' : 'en-US' }}
              disabled={saving}
            />
          </Stack>

          <FormControl size="small" fullWidth>
            <InputLabel id="scan-category-label">{t('category')}</InputLabel>
            <Select
              labelId="scan-category-label"
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
              onClick={handleSave}
              disabled={saving || !form.categoryId || !form.amount || !form.expenseDate}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : t('save')}
            </Button>
            <Button variant="outlined" onClick={reset} disabled={saving}>
              {t('scanAnother')}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
