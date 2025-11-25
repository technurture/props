
import PatientDetailsMedicalHistoryComponent from "@/components/patients/patientDetailsMedicalHistory";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Patient Details Medical History | Life Point Medical Centre EMR",
};

export default function PatientsDetailsMedicalHistoryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDetailsMedicalHistoryComponent />
    </Suspense>
  );
}
