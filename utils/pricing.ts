/** Parse the first monetary number out of a string like "$40.00" or "Rs 1,299". */
export function parseMoney(text: string | null | undefined): number {
  if (!text) return NaN;
  const m = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : NaN;
}

/** Rounded percentage discount from a compare-at and sale price. */
export function computeSavePct(compareAt: number, sale: number): number {
  if (!compareAt || compareAt <= 0) return NaN;
  return Math.round(((compareAt - sale) / compareAt) * 100);
}
