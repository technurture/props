import LabResultsComponent from "@/components/laboratory/lab-results/labResults";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Lab result | Life Point Medical Centre EMR",
};

export default function LabResultPage() {
  return (
    <>
      <LabResultsComponent />
    </>
  );
}
