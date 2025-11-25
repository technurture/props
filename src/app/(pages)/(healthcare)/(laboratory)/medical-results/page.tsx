import MedicalResultsComponent from "@/components/laboratory/medical-results/medicalResults";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Medical result | Life Point Medical Centre EMR",
};

export default function MedicalResultPage() {
  return (
    <>
      <MedicalResultsComponent />
    </>
  );
}
