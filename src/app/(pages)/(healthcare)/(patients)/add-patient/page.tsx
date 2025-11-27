
import AddPatientComponent from "@/components/patients/addPatient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Add Patient | NuncCare EMR",
};

export default function AddPatientsPage() {
  return (
    <>
      <AddPatientComponent />
    </>
  );
}
