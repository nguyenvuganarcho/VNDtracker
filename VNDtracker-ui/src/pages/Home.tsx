import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import axios from 'axios';

type HealthStatus = 'checking' | 'ok' | 'unreachable';

const HEALTH_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '/health');

export default function Home() {
  const [status, setStatus] = useState<HealthStatus>('checking');

  useEffect(() => {
    axios
      .get(HEALTH_URL)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        VNDtracker
      </Typography>
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
