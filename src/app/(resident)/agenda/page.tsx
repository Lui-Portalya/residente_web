import Link from "next/link";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { NoResidence } from "@/components/NoResidence";
import { addDays, formatDate, fromMinutes, isDate, localNow, toMinutes, today } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireResident } from "@/server/auth/guard";
import { getArea, listAreas } from "@/server/repos/areas";
import { listForAreaRange } from "@/server/repos/reservations";
import { cancelOwnReservationAction, reserveAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ area?: string; date?: string }> }) {
  const { residence } = await requireResident();
  if (!residence) return (<><h1>Common areas agenda</h1><NoResidence /></>);

  const sp = await searchParams;
  const areas = listAreas(true);
  const area = (sp.area && getArea(Number(sp.area))?.active ? getArea(Number(sp.area)) : undefined) ?? areas[0];
  const date = sp.date && isDate(sp.date) ? sp.date : today();

  if (!area) return (<><h1>Common areas agenda</h1><p className="muted">No common areas are available for booking.</p></>);

  const booked = new Map(listForAreaRange(area.id, date, 1).map((r) => [r.start_at.slice(11), r]));
  const now = localNow();
  const slots: string[] = [];
  for (let m = toMinutes(area.open_time); m + area.slot_minutes <= toMinutes(area.close_time); m += area.slot_minutes) slots.push(fromMinutes(m));
  const qs = (d: string) => `/agenda?area=${area.id}&date=${d}`;

  return (
    <>
      <h1>Common areas agenda</h1>
      <form className="toolbar" method="get">
        <label>Area
          <select name="area" defaultValue={area.id}>{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </label>
        <label>Date<input type="date" name="date" defaultValue={date} /></label>
        <button type="submit" className="secondary">Show</button>
      </form>

      <div className="toolbar">
        <Link className="btn secondary" href={qs(addDays(date, -1))}>← Previous day</Link>
        <strong>{formatDate(date)}</strong>
        <Link className="btn secondary" href={qs(addDays(date, 1))}>Next day →</Link>
      </div>
      <p className="muted">
        {area.description} {area.capacity > 0 && `Capacity ${area.capacity}. `}
        {area.fee_cents > 0 ? `Fee ${formatMoney(area.fee_cents)} per slot, added to your charges.` : "Free of charge."}
      </p>

      <div className="slots">
        {slots.map((start) => {
          const b = booked.get(start);
          const past = `${date}T${start}` <= now;
          const mine = b?.residence_id === residence.id;
          const end = fromMinutes(toMinutes(start) + area.slot_minutes);
          return (
            <div key={start} className={`slot ${b ? (mine ? "mine" : "booked") : ""} ${past ? "past" : ""}`}>
              <span>{start}–{end}</span>
              {b ? (
                <span>
                  {mine ? "Your booking" : `Booked by ${b.residence_code}`}
                  {mine && !past && (
                    <form action={cancelOwnReservationAction} style={{ display: "inline", marginLeft: 8 }}>
                      <input type="hidden" name="id" value={b.id} />
                      <ConfirmButton message="Cancel this booking?">Cancel</ConfirmButton>
                    </form>
                  )}
                </span>
              ) : past ? (
                <span className="muted">Past</span>
              ) : (
                <ActionForm action={reserveAction} className="row" submitLabel="Book">
                  <input type="hidden" name="areaId" value={area.id} />
                  <input type="hidden" name="date" value={date} />
                  <input type="hidden" name="start" value={start} />
                </ActionForm>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
