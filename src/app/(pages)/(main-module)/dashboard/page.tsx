import RoleDashboardRouter from "@/components/dashboard/RoleDashboardRouter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Dashboard | Life Point Medical Centre EMR",
};

export default function Dashboard() {
  return (
    <>
      <RoleDashboardRouter />
    </>
  );
}
