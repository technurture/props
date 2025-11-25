import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nurse Queue | Life Point Medical Centre EMR",
};

export default function NurseQueuePage() {
  return (
    <QueuePage
      requiredRole="NURSE"
      pageTitle="Nurse Queue"
      stageName="nurse"
    />
  );
}
