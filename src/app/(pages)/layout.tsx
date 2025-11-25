"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";

import Header from "@/core/common-components/header/header";
import Sidebar from "@/core/common-components/sidebar/sidebar";
import ClockInGuard from "@/components/common/ClockInGuard";

import {
  resetMobileSidebar,
  setHiddenLayout,
  setMobileSidebar,
} from "@/core/redux/sidebarSlice";
import { updateTheme } from "@/core/redux/themeSlice";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dispatch = useDispatch();

  const themeSettings = useSelector((state: any) => state.theme.themeSettings);
  const { miniSidebar, mobileSidebar, expandMenu, hiddenLayout } = useSelector(
    (state: any) => state.sidebarSlice
  );

  const mainWrapperRef = useRef<HTMLDivElement>(null);

  const dataLayout = themeSettings["data-layout"];
  const dataWidth = themeSettings["data-width"];
  const dataSize = themeSettings["data-size"];
  const dir = themeSettings["dir"];

  const [previousPath, setPreviousPath] = useState(pathname);

  // Reset mobile sidebar on route change
  useEffect(() => {
    dispatch(resetMobileSidebar());
  }, [pathname, dispatch]);

  // Handle route-based theme updates
  useEffect(() => {
    const layoutPaths = [
      "/layout-mini",
      "/layout-hoverview",
      "/layout-hidden",
      "/layout-fullwidth",
      "/layout-rtl",
      "/layout-dark",
    ];

    const isCurrentLayoutPage = layoutPaths.includes(pathname);
    const wasPreviousLayoutPage = layoutPaths.includes(previousPath);

    if (pathname === "/layout-hidden") {
      dispatch(updateTheme({ "data-layout": "hidden" }));
      dispatch(setHiddenLayout(false));
    } else if (pathname === "/layout-mini") {
      dispatch(updateTheme({ "data-layout": "mini" }));
    } else if (pathname === "/layout-hoverview") {
      dispatch(updateTheme({ "data-layout": "hover" }));
    } else if (pathname === "/layout-fullwidth") {
      dispatch(updateTheme({ "data-width": "box" }));
    } else if (pathname === "/layout-rtl") {
      dispatch(updateTheme({ dir: "rtl" }));
    } else if (pathname === "/layout-dark") {
      dispatch(
        updateTheme({
          "data-bs-theme": "dark",
          "data-sidebar": "dark",
          "data-topbar": "dark",
        })
      );
    } else if (wasPreviousLayoutPage && !isCurrentLayoutPage) {
      dispatch(
        updateTheme({
          "data-bs-theme": "light",
          "data-sidebar": "light",
          "data-color": "primary",
          "data-topbar": "white",
          "data-layout": "default",
          "data-size": "default",
          "data-width": "fluid",
          "data-sidebarbg": "none",
          dir: "ltr",
        })
      );
    }

    setPreviousPath(pathname);
  }, [pathname, previousPath, dispatch]);

  // Hidden layout class toggle
  useEffect(() => {
    if (dataLayout === "hidden") {
      if (hiddenLayout) {
        document.body.classList.add("hidden-layout");
      } else {
        document.body.classList.remove("hidden-layout");
      }
    } else {
      document.body.classList.remove("hidden-layout");
    }
  }, [hiddenLayout, dataLayout]);

  // Mobile sidebar toggle
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (mobileSidebar) {
      htmlElement.classList.add("menu-opened");
    } else {
      htmlElement.classList.remove("menu-opened");
    }
  }, [mobileSidebar]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        mobileSidebar &&
        mainWrapperRef.current &&
        !mainWrapperRef.current.contains(event.target as Node)
      ) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          dispatch(setMobileSidebar(false));
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileSidebar, dispatch]);

  // Bootstrap tooltip re-init
  useEffect(() => {
    if (window.bootstrap) {
      const oldTooltips = document.querySelectorAll(".tooltip");
      oldTooltips.forEach(
        (el) => el.parentNode && el.parentNode.removeChild(el)
      );

      const tooltipTriggerList = Array.from(
        document.querySelectorAll("[data-bs-toggle='tooltip']")
      );
      const tooltipInstances = tooltipTriggerList.map(function (
        tooltipTriggerEl
      ) {
        return new window.bootstrap!.Tooltip(tooltipTriggerEl as HTMLElement);
      });

      return () => {
        tooltipInstances.forEach(
          (instance) => instance.dispose && instance.dispose()
        );
        const tooltips = document.querySelectorAll(".tooltip");
        tooltips.forEach(
          (el) => el.parentNode && el.parentNode.removeChild(el)
        );
      };
    }
  });

  return (
    <ClockInGuard>
      <div
        className={`
          ${
            miniSidebar || dataLayout === "mini" || dataSize === "compact"
              ? "mini-sidebar"
              : ""
          }
          ${
            (expandMenu && miniSidebar) || (expandMenu && dataLayout === "mini")
              ? "expand-menu"
              : ""
          }
          ${mobileSidebar ? "menu-opened slide-nav" : ""}
          ${dataWidth === "box" ? "layout-box-mode" : ""}
          ${dir === "rtl" ? "layout-mode-rtl" : ""}
        `}
      >
        <div className="main-wrapper" ref={mainWrapperRef}>
          <Header />
          <Sidebar />
          {children}
        </div>
        <div
          className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}
          onClick={() => mobileSidebar && dispatch(setMobileSidebar(false))}
        ></div>
      </div>
    </ClockInGuard>
  );
}
