/** Helpers for pack-based pricing.

 * Two models:
 * 1) Price per м² + packArea → sold in whole packs (room calculator enabled)
 * 2) Price per упаковка/уп. → cart qty is packs; room calc only if packArea known
 */

export type PackDims = {
  price: number;
  unit?: string | null;
  packArea?: number | null;
  packQty?: number | null;
  length?: number | null;
  width?: number | null;
};

function normUnit(unit?: string | null) {
  return String(unit || '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

/** Catalog price is already for one pack (упаковка / уп. / legacy пачка). */
export function isPackPriced(p: PackDims): boolean {
  const u = normUnit(p.unit);
  return /пачк|упак|^уп\.?$|^уп$|pack/.test(u);
}

/** User-facing unit label: never «пачка» — only «упаковка» or short «уп.». */
export function formatUnit(unit?: string | null, opts?: { short?: boolean }): string {
  const raw = String(unit || '').trim();
  if (!raw) return opts?.short ? 'уп.' : 'упаковка';
  const u = normUnit(raw);
  if (/пачк|упаков|упак|^уп\.?$|^уп$|pack/.test(u)) {
    return opts?.short ? 'уп.' : 'упаковка';
  }
  return raw;
}

/** m² per pack: prefer stored packArea, else L×W(mm)×pieces */
export function resolvePackArea(p: PackDims): number | null {
  if (p.packArea != null && p.packArea > 0) return p.packArea;
  const len = p.length != null ? Number(p.length) : 0;
  const wid = p.width != null ? Number(p.width) : 0;
  const qty = p.packQty != null ? Number(p.packQty) : 0;
  if (len > 0 && wid > 0 && qty > 0) {
    return (len / 1000) * (wid / 1000) * qty;
  }
  return null;
}

/** Sold in packs (cart qty = packs). */
export function isPackSold(p: PackDims): boolean {
  if (isPackPriced(p)) return true;
  return resolvePackArea(p) != null && (normUnit(p.unit) === 'м²' || normUnit(p.unit) === 'м2' || !p.unit);
}

/** Room → packs calculator needs known pack area. */
export function canRoomCalculate(p: PackDims): boolean {
  return isPackSold(p) && resolvePackArea(p) != null;
}

/** Price of one pack in ₽. */
export function packPrice(p: PackDims): number | null {
  if (!p.price || p.price <= 0) return null;
  if (isPackPriced(p)) return p.price;
  const area = resolvePackArea(p);
  if (area == null) return null;
  return p.price * area;
}

export function packsToArea(packs: number, p: PackDims): number {
  const area = resolvePackArea(p) || 1;
  return packs * area;
}

export function areaToPacks(areaM2: number, p: PackDims): number {
  const area = resolvePackArea(p);
  if (area == null || area <= 0) return Math.max(1, Math.ceil(areaM2));
  return Math.max(1, Math.ceil(areaM2 / area));
}

export function lineTotal(qty: number, p: PackDims): number {
  if (isPackPriced(p)) return qty * p.price;
  if (isPackSold(p)) {
    const area = resolvePackArea(p) || 0;
    return qty * area * p.price;
  }
  return qty * p.price;
}

export function formatBoardSize(p: PackDims): string | null {
  if (p.length == null || p.width == null) return null;
  const l = Number(p.length);
  const w = Number(p.width);
  if (!l || !w) return null;
  return `${formatMm(l)} × ${formatMm(w)} мм`;
}

function formatMm(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

export function formatPackArea(area: number): string {
  return area.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

/** Suggested packArea from board dims (for admin hint). */
export function suggestedPackArea(lengthMm: number, widthMm: number, pieces: number): number | null {
  if (lengthMm <= 0 || widthMm <= 0 || pieces <= 0) return null;
  const v = (lengthMm / 1000) * (widthMm / 1000) * pieces;
  return Math.round(v * 1000) / 1000;
}
