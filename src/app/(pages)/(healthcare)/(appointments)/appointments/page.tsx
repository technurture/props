import AppointmentComponent from "@/components/appointments/appointments";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Appointments | Life Point Medical Centre EMR",
};

export default function AppointmentsPage() {
  return (
    <>
      <AppointmentComponent />
    </>
  );
}
