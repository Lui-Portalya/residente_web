import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { currentPeriod, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listResidences, type ResidenceRow } from "@/server/repos/residences";
import { deleteResidenceAction, generateChargesAction, saveResidenceAction } from "./actions";

export const dynamic = "force-dynamic";

function ResidenceFields({ r }: { r?: ResidenceRow }) {
  return (
    <>
      {r && <input type="hidden" name="id" value={r.id} />}
      <label>Code<input name="code" defaultValue={r?.code} required placeholder="A-101" /></label>
      <label>Address<input name="address" defaultValue={r?.address} /></label>
      <label>Monthly maintenance fee<input name="monthlyFee" defaultValue={r ? (r.monthly_fee_cents / 100).toFixed(2) : "0.00"} inputMode="decimal" required /></label>
      <label>Notes<textarea name="notes" defaultValue={r?.notes} rows={2} /></label>
      <label className="check"><input type="checkbox" name="active" defaultChecked={r ? !!r.active : true} /> Active</label>
    </>
  );
}

export default function ResidencesPage() {
  const residences = listResidences();
  return (
    <>
      <h1>Residences</h1>

      <details className="card">
        <summary><strong>New residence</strong></summary>
        <ActionForm action={saveResidenceAction} submitLabel="Create residence"><ResidenceFields /></ActionForm>
      </details>

      <div className="card">
        <strong>Generate maintenance charges</strong>
        <p className="muted">Creates one charge per active residence for the period. Existing charges are skipped, so it is safe to re-run.</p>
        <ActionForm action={generateChargesAction} className="row" submitLabel="Generate">
          <label>Period<input name="period" defaultValue={currentPeriod()} pattern="\d{4}-\d{2}" required /></label>
          <label>Due date<input name="dueDate" type="date" defaultValue={today()} required /></label>
        </ActionForm>
      </div>

      <div className="cards">
      {residences.map((r) => (
        <details className="card item" key={r.id}>
          <summary>
            <span className="item-title">
              {r.code}
              <span className={`badge ${r.active ? "ok" : "off"}`}>{r.active ? "active" : "inactive"}</span>
            </span>
            <span className="item-meta"><span>{r.address || "No address"}</span></span>
            <span className="item-meta"><span>{formatMoney(r.monthly_fee_cents)}/mo</span><span>{r.residents} resident(s)</span></span>
          </summary>
          <ActionForm action={saveResidenceAction} submitLabel="Save changes"><ResidenceFields r={r} /></ActionForm>
          <form action={deleteResidenceAction} style={{ marginTop: 12 }}>
            <input type="hidden" name="id" value={r.id} />
            <ConfirmButton message={`Delete residence ${r.code}? Only possible if it has no residents or history.`}>Delete</ConfirmButton>
          </form>
        </details>
      ))}
      </div>
      {residences.length === 0 && <p className="muted">No residences yet.</p>}
    </>
  );
}
