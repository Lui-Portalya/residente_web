export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** "12.50" -> 1250. Returns null for anything that is not a non-negative amount with <=2 decimals. */
export function parseMoney(input: string): number | null {
  const m = /^\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(input);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || 0);
}
