import PatientDetailsPrescriptionComponent from "@/components/patients/patientDetailsPrescription";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Patient Details Prescription | Life Point Medical Centre EMR",
};

export default function PatientsDetailsPrescriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDetailsPrescriptionComponent />
    </Suspense>
  );
}
