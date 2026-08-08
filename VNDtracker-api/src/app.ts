import express, { Application } from 'express';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import cors from 'cors';

const app: Application = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
