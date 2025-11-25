import React from "react";
import { usePathname } from "next/navigation";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";

const SettingsTabs: React.FC = () => {
  const location = usePathname();
  const pathname = location;

  const tabs = [
    { label: "General", route: all_routes.generalSettings },
    { label: "Security", route: all_routes.securitySettings }, 
    { label: "Notifications", route: all_routes.notificationsSettings },
  ];

  return (
    <ul className="nav nav-tabs nav-solid-primary mb-3 border-bottom pb-4 mb-4 d-flex align-items-center gap-2">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.route}>
          <Link
            href={tab.route}
            className={`nav-link border rounded fw-semibold${pathname === tab.route ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default SettingsTabs; 