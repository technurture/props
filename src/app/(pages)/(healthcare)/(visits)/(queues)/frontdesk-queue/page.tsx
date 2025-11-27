import QueuePage from "@/components/visits/queue/QueuePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Front Desk Queue | NuncCare EMR",
};

export default function FrontdeskQueuePage() {
  return (
    <QueuePage
      requiredRole="FRONTDESK"
      pageTitle="Front Desk Queue"
      stageName="front_desk"
    />
  );
}
