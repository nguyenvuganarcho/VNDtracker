import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { changePasswordApi } from '../api/auth';
import { useLanguage } from '../i18n';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const reset = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword) {
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
      const response = await changePasswordApi({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(handleClose, 1200);
      } else {
        setError(response.message || t('changePasswordFailed'));
      }
    } catch (err) {
      const message = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || t('changePasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('changePassword')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('passwordChanged')}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('currentPassword')}
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading || success}
            autoFocus
          />
          <TextField
            fullWidth
            label={t('newPassword')}
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading || success}
            helperText={t('passwordHelper')}
          />
          <TextField
            fullWidth
            label={t('confirmNewPassword')}
            name="confirmNewPassword"
            type="password"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading || success}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || success}>
            {loading ? <CircularProgress size={20} color="inherit" /> : t('changePassword')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
