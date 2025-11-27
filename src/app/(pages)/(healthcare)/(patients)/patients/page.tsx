import PatientsComponent from "@/components/patients/patients";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Patient | NuncCare EMR",
};

export default function PatientsPage() {
  return (
    <>
      <PatientsComponent />
    </>
  );
}
