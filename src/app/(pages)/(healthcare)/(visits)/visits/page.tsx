import VisitsComponent from "@/components/visits/visits";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Visits | Life Point Medical Centre EMR",
};

export default function VisitsPage() {
  return (
    <>
      <VisitsComponent />
    </>
  );
}
