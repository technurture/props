import RoleDashboardRouter from "@/components/dashboard/RoleDashboardRouter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Dashboard | NuncCare EMR",
};

export default function Dashboard() {
  return (
    <>
      <RoleDashboardRouter />
    </>
  );
}
