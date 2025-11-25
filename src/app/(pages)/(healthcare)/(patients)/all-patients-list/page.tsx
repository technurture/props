import AllPatientsListComponent from "@/components/patients/allPatientsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "All Patients List | Life Point Medical Centre EMR",
};

export default function AllPatientsListPage() {
  return (
    <>
      <AllPatientsListComponent />
    </>
  );
}
