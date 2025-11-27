import AllPatientsListComponent from "@/components/patients/allPatientsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "All Patients List | NuncCare EMR",
};

export default function AllPatientsListPage() {
  return (
    <>
      <AllPatientsListComponent />
    </>
  );
}
