import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatDateTime } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listAreas, type AreaRow } from "@/server/repos/areas";
import { listUpcoming } from "@/server/repos/reservations";
import { adminCancelReservationAction, saveAreaAction } from "./actions";

export const dynamic = "force-dynamic";

function AreaFields({ a }: { a?: AreaRow }) {
  return (
    <>
      {a && <input type="hidden" name="id" value={a.id} />}
      <label>Name<input name="name" defaultValue={a?.name} required /></label>
      <label>Description<textarea name="description" defaultValue={a?.description} rows={2} /></label>
      <label>Capacity<input name="capacity" type="number" min={0} defaultValue={a?.capacity ?? 0} /></label>
      <label>Opens<input name="openTime" type="time" defaultValue={a?.open_time ?? "08:00"} required /></label>
      <label>Closes<input name="closeTime" type="time" defaultValue={a?.close_time ?? "22:00"} required /></label>
      <label>Slot length (minutes)<input name="slotMinutes" type="number" min={15} step={15} defaultValue={a?.slot_minutes ?? 60} required /></label>
      <label>Fee per slot<input name="fee" inputMode="decimal" defaultValue={a ? (a.fee_cents / 100).toFixed(2) : "0.00"} required /></label>
      <label className="check"><input type="checkbox" name="active" defaultChecked={a ? !!a.active : true} /> Active (bookable)</label>
    </>
  );
}

export default function AreasPage() {
  const areas = listAreas();
  const upcoming = listUpcoming({ limit: 100 });
  return (
    <>
      <h1>Common areas</h1>
      <details className="card">
        <summary><strong>New common area</strong></summary>
        <ActionForm action={saveAreaAction} submitLabel="Create area"><AreaFields /></ActionForm>
      </details>

      {areas.map((a) => (
        <details className="card" key={a.id}>
          <summary>
            <strong>{a.name}</strong> · {a.open_time}–{a.close_time} · {a.slot_minutes} min · {a.fee_cents ? formatMoney(a.fee_cents) : "free"}{" "}
            <span className={`badge ${a.active ? "ok" : "off"}`}>{a.active ? "active" : "inactive"}</span>
          </summary>
          <ActionForm action={saveAreaAction} submitLabel="Save changes"><AreaFields a={a} /></ActionForm>
        </details>
      ))}

      <h2>Upcoming reservations</h2>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Area</th><th>When</th><th>Residence</th><th /></tr></thead>
          <tbody>
            {upcoming.map((v) => (
              <tr key={v.id}>
                <td>{v.area_name}</td><td>{formatDateTime(v.start_at)}–{v.end_at.slice(11)}</td><td>{v.residence_code}</td>
                <td>
                  <form action={adminCancelReservationAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <ConfirmButton message="Cancel this reservation?">Cancel</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
            {upcoming.length === 0 && <tr><td colSpan={4} className="muted">Nothing booked.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
