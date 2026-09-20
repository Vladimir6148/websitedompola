import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err && typeof err === 'object' && 'name' in err && err.name === 'ZodError') {
    return res.status(400).json({ error: 'Ошибка валидации', details: err });
  }
  const message = err instanceof Error ? err.message : 'Внутренняя ошибка сервера';
  res.status(500).json({ error: message });
}
