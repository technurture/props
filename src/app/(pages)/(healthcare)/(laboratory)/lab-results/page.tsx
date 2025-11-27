import LabResultsComponent from "@/components/laboratory/lab-results/labResults";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Lab result | NuncCare EMR",
};

export default function LabResultPage() {
  return (
    <>
      <LabResultsComponent />
    </>
  );
}
