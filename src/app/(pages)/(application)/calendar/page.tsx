import CalendarComponent from "@/components/application/calendar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Calendar | Life Point Medical Centre EMR",
};

export default function CalendarPage() {
  return (
    <>
      <CalendarComponent />
    </>
  );
}
