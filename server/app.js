import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import intelRouter from './routes/intel.js';
import { errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/intel', intelRouter);

// Serve Static Assets in production
const distPath = path.join(__dirname, '../dist/client');
app.use(express.static(distPath));

// Catch-all route to serve the Single Page Application's index.html
app.get('/*path', (req, res, next) => {
  // Only fallback for non-API requests
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // If build folder doesn't exist yet, return a simple welcoming API message
      res.status(200).send('CyberKit OSINT Backend running. Please build client using Vite.');
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Listen
app.listen(PORT, () => {
  console.log(`[SYSTEM] CyberKit server running on port ${PORT}`);
});

export default app;
