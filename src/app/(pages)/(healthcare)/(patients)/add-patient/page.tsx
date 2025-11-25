
import AddPatientComponent from "@/components/patients/addPatient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Add Patient | Life Point Medical Centre EMR",
};

export default function AddPatientsPage() {
  return (
    <>
      <AddPatientComponent />
    </>
  );
}
