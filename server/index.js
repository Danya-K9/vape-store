import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import favoriteRoutes from './routes/favorites.js';
import adminRoutes from './routes/admin.js';
import storeRoutes from './routes/stores.js';
import directorRoutes from './routes/director.js';
import filterRoutes from './routes/filters.js';
import { startTelegramBot } from './telegram/bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://vape-store-production.up.railway.app',
  ],
  credentials: true,
};
app.use(cors(corsOptions));
// Explicitly handle preflight, otherwise OPTIONS may fall through to static and return 405
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Serve frontend (Vite build) from the same Railway service
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

async function main() {
  await prisma.$connect();
  startTelegramBot();
  app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
