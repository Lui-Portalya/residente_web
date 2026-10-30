import Link from "next/link";
import { logoutAction } from "@/app/(auth)/login/actions";

export function Shell({ links, userName, children }: { links: { href: string; label: string }[]; userName: string; children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="shell">
          <span className="brand">Residente</span>
          <nav aria-label="Main">{links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>
          <form action={logoutAction} className="row">
            <span className="muted">{userName}</span>
            <button type="submit" className="secondary">Log out</button>
          </form>
        </div>
      </header>
      <main className="shell" style={{ paddingTop: 24 }}>{children}</main>
    </>
  );
}
