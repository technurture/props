"use client";

import { StrictMode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import ClientStoreProvider from "@/core/redux/clientStore";
import ErrorBoundary from "@/core/common-components/common-error-boundary/ErrorBoundary";
import ToastProvider from "@/components/ui-intrerface/ToastProvider";
import NotificationListener from "@/core/common-components/NotificationListener/NotificationListener";

function GlobalTooltipInit() {
  const pathname = usePathname();

  useEffect(() => {
    let bootstrap: typeof import("bootstrap");

    (async () => {
      // Import bootstrap with types
      bootstrap = await import("bootstrap");

      // Remove existing tooltips (avoid duplicates)
      document.querySelectorAll(".tooltip").forEach((el) => el.remove());

      // Initialize new tooltips
      const tooltipTriggerList = Array.from(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
      );
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new bootstrap.Tooltip(tooltipTriggerEl);
      });
    })();

    // Cleanup tooltips when component unmounts or before next re-run
    return () => {
      document.querySelectorAll(".tooltip").forEach((el) => el.remove());
    };
  }, [pathname]);

  return null;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StrictMode>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <ClientStoreProvider>
            <GlobalTooltipInit />
            <ToastProvider />
            <NotificationListener />
            <ErrorBoundary>{children}</ErrorBoundary>
          </ClientStoreProvider>
        </SessionProvider>
      </I18nextProvider>
    </StrictMode>
  );
}
