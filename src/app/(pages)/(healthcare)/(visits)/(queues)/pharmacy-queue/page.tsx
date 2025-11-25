import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pharmacy Queue | Life Point Medical Centre EMR",
};

export default function PharmacyQueuePage() {
  return (
    <QueuePage
      requiredRole="PHARMACY"
      pageTitle="Pharmacy Queue"
      stageName="pharmacy"
    />
  );
}
