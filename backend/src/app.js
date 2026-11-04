import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import donorRoutes from './routes/donors.routes.js';
import requestRoutes from './routes/requests.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { publicStats } from './controllers/admin.controller.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

// CORS: only the frontend URL(s) from CLIENT_URL may call the API from a browser
const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.get('/api/stats/public', publicStats);
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
