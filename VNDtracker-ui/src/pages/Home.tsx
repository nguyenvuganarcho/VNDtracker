import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import axios from 'axios';
import { getUser, removeToken } from '../utils/auth';

type HealthStatus = 'checking' | 'ok' | 'unreachable';

const HEALTH_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '/health');

export default function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<HealthStatus>('checking');
  const user = getUser();

  useEffect(() => {
    axios
      .get(HEALTH_URL)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unreachable'));
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

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
        Backend connection status:
      </Typography>
      <Chip
        label={status === 'checking' ? 'Checking...' : status === 'ok' ? 'Connected' : 'Unreachable'}
        color={status === 'ok' ? 'success' : status === 'unreachable' ? 'error' : 'default'}
      />
    </Box>
  );
}
