import QueueMonitoringDashboard from "@/components/dashboard/QueueMonitoringDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Queue Monitoring | NuncCare EMR",
  description: "Real-time monitoring of all department queues",
};

export default function QueueMonitoringPage() {
  return (
    <div className="page-wrapper">
      <div className="content">
        <QueueMonitoringDashboard />
      </div>
    </div>
  );
}
