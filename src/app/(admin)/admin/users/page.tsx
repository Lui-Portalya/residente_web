import { ActionForm } from "@/components/ActionForm";
import { listResidences } from "@/server/repos/residences";
import { listUsers } from "@/server/repos/users";
import { createUserAction, resetPasswordAction, updateUserAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const users = listUsers(q);
  const residences = listResidences().filter((r) => r.active);

  const residenceSelect = (current: number | null) => (
    <label>Residence
      <select name="residenceId" defaultValue={current ?? ""}>
        <option value="">— none —</option>
        {residences.map((r) => <option key={r.id} value={r.id}>{r.code}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <h1>Users</h1>
      <form className="toolbar" method="get">
        <label>Search<input name="q" defaultValue={q} placeholder="Name or email" /></label>
        <button type="submit" className="secondary">Search</button>
      </form>

      <details className="card">
        <summary><strong>New user</strong></summary>
        <ActionForm action={createUserAction} submitLabel="Create user">
          <label>Name<input name="name" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Role
            <select name="role" defaultValue="resident"><option value="resident">Resident</option><option value="admin">Admin</option></select>
          </label>
          {residenceSelect(null)}
          <label>Initial password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
        </ActionForm>
      </details>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Residence</th><th>Status</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td colSpan={5} style={{ padding: 0 }}>
                  <details>
                    <summary style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, padding: 8, cursor: "pointer" }}>
                      <span>{u.name}</span><span>{u.email}</span><span>{u.role}</span><span>{u.residence_code ?? "—"}</span>
                      <span className={`badge ${u.active ? "ok" : "off"}`} style={{ justifySelf: "start" }}>{u.active ? "active" : "inactive"}</span>
                    </summary>
                    <div style={{ padding: 12 }}>
                      <ActionForm action={updateUserAction} submitLabel="Save changes">
                        <input type="hidden" name="id" value={u.id} />
                        <label>Name<input name="name" defaultValue={u.name} required /></label>
                        <label>Email<input name="email" type="email" defaultValue={u.email} required /></label>
                        <label>Role
                          <select name="role" defaultValue={u.role}><option value="resident">Resident</option><option value="admin">Admin</option></select>
                        </label>
                        {residenceSelect(u.residence_id)}
                        <label className="check"><input type="checkbox" name="active" defaultChecked={!!u.active} /> Active</label>
                      </ActionForm>
                      <h2>Reset password</h2>
                      <ActionForm action={resetPasswordAction} className="row" submitLabel="Reset" submitClass="secondary">
                        <input type="hidden" name="id" value={u.id} />
                        <label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label>
                      </ActionForm>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="muted">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
