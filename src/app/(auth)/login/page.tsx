import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { getSessionUser } from "@/server/auth/session";
import { loginAction } from "./actions";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/");
  return (
    <div className="login">
      <h1>Residente</h1>
      <div className="card">
        <ActionForm action={loginAction} submitLabel="Sign in">
          <label>Email or username<input name="email" type="text" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        </ActionForm>
      </div>
    </div>
  );
}
