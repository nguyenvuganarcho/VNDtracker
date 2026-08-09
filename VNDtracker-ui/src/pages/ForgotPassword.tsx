import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { forgotPasswordApi } from '../api/auth';
import { useLanguage } from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(t('fillAllFields'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await forgotPasswordApi({ email });
      setSent(true);
    } catch {
      // Never surface a distinct error for "email not found" -- the backend
      // already returns the same generic success response for that case, so
      // reaching this branch means an actual request/server error.
      setError(t('forgotPasswordFailed'));
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
            {t('forgotPasswordSubtitle')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {sent ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('resetLinkSentNote')}
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                margin="normal"
                required
                disabled={loading}
                autoFocus
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : t('sendResetLink')}
              </Button>
            </form>
          )}

          <Typography variant="body2" align="center">
            <Link component={RouterLink} to="/login">
              {t('backToLogin')}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
