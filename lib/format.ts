/** ₹ formatting from integer paise, Indian digit grouping (1,23,456). */
export function formatRupees(paise: number): string {
  const v = paise / 100;
  return "₹" + v.toLocaleString("en-IN", {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** "120.50" / "(120.5" etc -> paise; NaN if not a usable positive amount. */
export function toPaise(input: string | number): number {
  const n = typeof input === "number" ? input : parseFloat(String(input).replace(/,/g, ""));
  if (!isFinite(n)) return NaN;
  return Math.round(n * 100);
}

/** Date -> value usable in <input type="datetime-local">, in the BROWSER's timezone. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}