import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import brandRoutes from './routes/brands.js';
import productRoutes from './routes/products.js';
import storeRoutes from './routes/stores.js';
import promotionRoutes from './routes/promotions.js';
import leadRoutes from './routes/leads.js';
import contentRoutes from './routes/content.js';
import uploadRoutes from './routes/upload.js';
import pickerRoutes from './routes/picker.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, '../', process.env.UPLOAD_DIR || 'uploads');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadRoot));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'dompola-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/picker', pickerRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`ДОМПОЛА API → http://localhost:${port}`);
});
