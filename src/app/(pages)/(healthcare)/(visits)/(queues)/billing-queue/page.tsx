import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing Queue | Life Point Medical Centre EMR",
};

export default function BillingQueuePage() {
  return (
    <QueuePage
      requiredRole="BILLING"
      pageTitle="Billing Queue"
      stageName="billing"
    />
  );
}
