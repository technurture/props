// app/layout.tsx
import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "@tabler/icons-webfont/dist/tabler-icons.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../app/globals.scss";

import ClientProviders from "./providers"; // 👈 our client wrapper
import BootstrapJs from "@/core/common-components/bootstrap-js/bootstrapjs";

export const metadata: Metadata = {
  title: "Dashboard | Life Point Medical Centre - Electronic Medical Records System",
  description:
    "Life Point Medical Centre EMR is a modern, secure, and responsive electronic medical records management system.",
  icons: {
    icon: "life-point-logo.png",
    shortcut: "life-point-logo.png",
    apple: "life-point-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
        <BootstrapJs/>
      </body>
    </html>
  );
}
