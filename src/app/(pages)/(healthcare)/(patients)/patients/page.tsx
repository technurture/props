import PatientsComponent from "@/components/patients/patients";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Patient | Life Point Medical Centre EMR",
};

export default function PatientsPage() {
  return (
    <>
      <PatientsComponent />
    </>
  );
}
