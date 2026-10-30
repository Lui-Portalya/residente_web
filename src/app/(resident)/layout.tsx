import { Shell } from "@/components/Shell";
import { requireResident } from "@/server/auth/guard";

export default async function ResidentLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireResident();
  return (
    <Shell
      userName={user.name}
      links={[
        { href: "/", label: "Home" },
        { href: "/payments", label: "Payments" },
        { href: "/agenda", label: "Common areas agenda" },
      ]}
    >
      {children}
    </Shell>
  );
}
