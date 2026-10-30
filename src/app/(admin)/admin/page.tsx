import { getDb } from "@/server/db/client";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default function AdminHome() {
  const db = getDb();
  const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
  const pending = n("SELECT COALESCE(SUM(amount_cents),0) AS n FROM charges WHERE status = 'pending'") -
    n("SELECT COALESCE(SUM(p.amount_cents),0) AS n FROM payments p JOIN charges c ON c.id = p.charge_id WHERE c.status = 'pending'");
  const stats = [
    ["Active users", n("SELECT COUNT(*) AS n FROM users WHERE active = 1")],
    ["Active residences", n("SELECT COUNT(*) AS n FROM residences WHERE active = 1")],
    ["Common areas", n("SELECT COUNT(*) AS n FROM common_areas WHERE active = 1")],
    ["Outstanding balance", formatMoney(pending)],
  ];
  return (
    <>
      <h1>Overview</h1>
      <div className="grid">
        {stats.map(([label, value]) => (
          <div className="card" key={label}><div className="muted">{label}</div><div className="stat">{value}</div></div>
        ))}
      </div>
    </>
  );
}
