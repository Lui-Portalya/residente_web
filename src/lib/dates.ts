// Community-local naive datetimes are stored as "YYYY-MM-DDTHH:mm".

const pad = (n: number) => String(n).padStart(2, "0");

export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const isTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function localNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function today(): string {
  return localNow().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function currentPeriod(): string {
  return today().slice(0, 7);
}

export function formatDateTime(local: string): string {
  const [date, time] = local.split("T");
  return `${formatDate(date)} ${time}`;
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
