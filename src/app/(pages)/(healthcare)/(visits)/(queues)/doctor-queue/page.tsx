import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Queue | NuncCare EMR",
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
