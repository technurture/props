import PatientDetailsLabResultsComponent from "@/components/patients/patientDetailsLabResults";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Patient Details Lab Result | NuncCare EMR",
};

export default function PatientsDetailsLabResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDetailsLabResultsComponent />
    </Suspense>
  );
}
