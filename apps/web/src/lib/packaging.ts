/** Helpers for pack-based pricing (price is always per m²; sell in whole packs). */

export type PackDims = {
  price: number;
  unit?: string | null;
  packArea?: number | null;
  packQty?: number | null;
  length?: number | null;
  width?: number | null;
};

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

/** Sold in packs when we know pack area (flooring). Else by unit (glue etc.). */
export function isPackSold(p: PackDims): boolean {
  return resolvePackArea(p) != null && (p.unit === 'м²' || p.unit === 'м2' || !p.unit);
}

export function packPrice(p: PackDims): number | null {
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
