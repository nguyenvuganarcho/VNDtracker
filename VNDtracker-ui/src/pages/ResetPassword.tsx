import { useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { resetPasswordApi } from '../api/auth';
import { useLanguage } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ResetPassword() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ newPassword: '', confirmNewPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmNewPassword) {
      setError(t('fillAllFields'));
      return;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPasswordApi({ token, newPassword: formData.newPassword });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || t('invalidResetLink'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>

      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
            VNDtracker
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            {t('resetPasswordSubtitle')}
          </Typography>

          {!token ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('invalidResetLink')}
            </Alert>
          ) : success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('resetPasswordSuccess')}
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label={t('newPassword')}
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, newPassword: e.target.value });
                    setError('');
                  }}
                  margin="normal"
                  required
                  disabled={loading}
                  helperText={t('passwordHelper')}
                  autoFocus
                />
                <TextField
                  fullWidth
                  label={t('confirmNewPassword')}
                  type="password"
                  value={formData.confirmNewPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmNewPassword: e.target.value });
                    setError('');
                  }}
                  margin="normal"
                  required
                  disabled={loading}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : t('resetPasswordButton')}
                </Button>
              </form>
            </>
          )}

          <Typography variant="body2" align="center">
            {!token || error ? (
              <Link component={RouterLink} to="/forgot-password">
                {t('requestNewLink')}
              </Link>
            ) : (
              <Link component={RouterLink} to="/login">
                {t('backToLogin')}
              </Link>
            )}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
