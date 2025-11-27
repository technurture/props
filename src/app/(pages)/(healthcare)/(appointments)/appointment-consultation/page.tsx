
import AppointmentConsultationComponent from "@/components/appointments/appointmentsConsultation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Appointment Consultation | NuncCare EMR",
};

export default function AppointmentConsultationPage() {
  return (
    <>
      <AppointmentConsultationComponent />
    </>
  );
}
