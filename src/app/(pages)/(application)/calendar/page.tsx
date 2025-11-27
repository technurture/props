import CalendarComponent from "@/components/application/calendar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Calendar | NuncCare EMR",
};

export default function CalendarPage() {
  return (
    <>
      <CalendarComponent />
    </>
  );
}
