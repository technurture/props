import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nurse Queue | NuncCare EMR",
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
