import Link from "next/link";
import { NoResidence } from "@/components/NoResidence";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireResident } from "@/server/auth/guard";
import { balanceCents, listCharges, listPayments } from "@/server/repos/payments";
import { listUpcoming } from "@/server/repos/reservations";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, residence } = await requireResident();
  if (!residence) return (<><h1>Welcome, {user.name}</h1><NoResidence /></>);

  const pending = listCharges(residence.id, "pending");
  const payments = listPayments(residence.id, 5);
  const bookings = listUpcoming({ residenceId: residence.id, limit: 5 });

  return (
    <>
      <h1>Welcome, {user.name}</h1>
      <div className="grid">
        <div className="card"><div className="muted">Residence</div><div className="stat">{residence.code}</div><div className="muted">{residence.address}</div></div>
        <div className="card"><div className="muted">Balance due</div><div className="stat">{formatMoney(balanceCents(residence.id))}</div><Link href="/payments">Register a payment</Link></div>
        <div className="card"><div className="muted">Upcoming bookings</div><div className="stat">{bookings.length}</div><Link href="/agenda">Open agenda</Link></div>
      </div>

      <h2>Pending charges</h2>
      <div className="cards">
        {pending.map((c) => (
          <div className="card" key={c.id}>
            <div className="card-head"><strong>{c.description}</strong><span className="badge warn">due {formatDate(c.due_date)}</span></div>
            <div className="stat">{formatMoney(c.amount_cents - c.paid_cents)}</div>
            <div className="muted">{c.type === "maintenance" ? "Maintenance" : "Common area"}</div>
          </div>
        ))}
      </div>
      {pending.length === 0 && <p className="muted">You are all caught up.</p>}

      <h2>Recent payments</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Date</th><th>For</th><th>Amount</th></tr></thead>
          <tbody>
            {payments.map((p) => <tr key={p.id}><td>{formatDate(p.paid_at)}</td><td>{p.charge_description}</td><td>{formatMoney(p.amount_cents)}</td></tr>)}
            {payments.length === 0 && <tr><td colSpan={3} className="muted">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Next bookings</h2>
      <div className="cards">
        {bookings.map((b) => (
          <div className="card" key={b.id}>
            <div className="card-head"><strong>{b.area_name}</strong></div>
            <div className="muted">{formatDateTime(b.start_at)}–{b.end_at.slice(11)}</div>
          </div>
        ))}
      </div>
      {bookings.length === 0 && <p className="muted">Nothing booked.</p>}
    </>
  );
}
