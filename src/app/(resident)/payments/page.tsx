import { ActionForm } from "@/components/ActionForm";
import { NoResidence } from "@/components/NoResidence";
import { formatDate, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireResident } from "@/server/auth/guard";
import { listCharges, listPayments } from "@/server/repos/payments";
import { registerPaymentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { residence } = await requireResident();
  if (!residence) return (<><h1>Payments</h1><NoResidence /></>);
  const pending = listCharges(residence.id, "pending");
  const payments = listPayments(residence.id);

  return (
    <>
      <h1>Payments</h1>
      <h2>Pending charges</h2>
      {pending.length === 0 && <p className="muted">Nothing to pay right now.</p>}
      <div className="cards">
      {pending.map((c) => {
        const remaining = c.amount_cents - c.paid_cents;
        return (
          <details className="card item" key={c.id}>
            <summary>
              <span className="item-title">{c.description}<span className="badge warn">due {formatDate(c.due_date)}</span></span>
              <span className="item-meta"><span>{c.type === "maintenance" ? "Maintenance" : "Common area"}</span><span>{formatMoney(remaining)} remaining</span></span>
            </summary>
            <ActionForm action={registerPaymentAction} submitLabel="Register payment">
              <input type="hidden" name="chargeId" value={c.id} />
              <label>Amount<input name="amount" inputMode="decimal" defaultValue={(remaining / 100).toFixed(2)} required /></label>
              <label>Method
                <select name="method" defaultValue="transfer">
                  <option value="transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option>
                </select>
              </label>
              <label>Reference<input name="reference" placeholder="Receipt or transfer number" /></label>
              <label>Date paid<input name="paidAt" type="date" max={today()} defaultValue={today()} required /></label>
              <label>Note<input name="note" /></label>
            </ActionForm>
          </details>
        );
      })}
      </div>

      <h2>History</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Date</th><th>For</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}><td>{formatDate(p.paid_at)}</td><td>{p.charge_description}</td><td>{p.method}</td><td>{p.reference || "—"}</td><td>{formatMoney(p.amount_cents)}</td></tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="muted">No payments registered.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
