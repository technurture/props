import PatientDetailsAppointmentsComponent from "@/components/patients/patientDetailsAppointments";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title:
    "Patient Details Appointment | Life Point Medical Centre EMR",
};

export default function PatientsDetailsAppointmentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PatientDetailsAppointmentsComponent />
    </Suspense>
  );
}
