import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/v1', apiRoutes);

// Root Status
app.get('/api', (_req, res) => {
  res.json({
    name: 'VoiceBridge AI — Inclusive Multilingual Translation Gateway',
    version: '1.0.0',
    status: 'online',
    docs: '/api/v1/health',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VoiceBridge AI Backend Engine listening on http://localhost:${PORT}`);
});
