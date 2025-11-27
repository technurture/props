import AppointmentComponent from "@/components/appointments/appointments";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Appointments | NuncCare EMR",
};

export default function AppointmentsPage() {
  return (
    <>
      <AppointmentComponent />
    </>
  );
}
