import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing Queue | NuncCare EMR",
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
