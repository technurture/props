import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Queue | Life Point Medical Centre EMR",
};

export default function DoctorQueuePage() {
  return (
    <QueuePage
      requiredRole="DOCTOR"
      pageTitle="Doctor Queue"
      stageName="doctor"
    />
  );
}
