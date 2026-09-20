import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { asyncHandler, requireAuth, requireRole } from '../lib/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Только изображения'));
      return;
    }
    cb(null, true);
  },
});

router.post(
  '/',
  requireAuth,
  requireRole('ADMIN', 'MANAGER'),
  upload.array('files', 12),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) || [];
    const base = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    const items = files.map((f) => ({
      url: `${base}/uploads/${f.filename}`,
      storageKey: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
    }));
    res.status(201).json({ items });
  }),
);

export default router;
