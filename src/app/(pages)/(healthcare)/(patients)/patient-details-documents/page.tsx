import PatientDetailsDocumentsComponent from "@/components/patients/patientDetailsDocuments";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Patient Details Documents | Life Point Medical Centre EMR",
};

export default function PatientsDetailsDocumentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDetailsDocumentsComponent />
    </Suspense>
  );
}
