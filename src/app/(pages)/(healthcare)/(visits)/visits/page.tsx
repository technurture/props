import VisitsComponent from "@/components/visits/visits";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Visits | NuncCare EMR",
};

export default function VisitsPage() {
  return (
    <>
      <VisitsComponent />
    </>
  );
}
