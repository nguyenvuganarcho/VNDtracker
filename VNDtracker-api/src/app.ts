import express, { Application } from 'express';
import path from 'path';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import cors from 'cors';

const app: Application = express();

// Render terminates TLS at its proxy; without this, rate limiting keys every
// request by the proxy's IP instead of the client's.
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
