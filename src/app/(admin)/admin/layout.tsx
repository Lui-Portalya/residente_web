import { Shell } from "@/components/Shell";
import { requireAdmin } from "@/server/auth/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <Shell
      userName={user.name}
      links={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/residences", label: "Residences" },
        { href: "/admin/areas", label: "Common areas" },
      ]}
    >
      {children}
    </Shell>
  );
}
