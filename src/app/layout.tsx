import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = { title: "Residente", description: "Residential community management" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
