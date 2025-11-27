import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laboratory Queue | NuncCare EMR",
};

export default function LabQueuePage() {
  return (
    <QueuePage
      requiredRole="LAB"
      pageTitle="Laboratory Queue"
      stageName="lab"
    />
  );
}
