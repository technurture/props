
import EditPatientComponent from "@/components/patients/editPatient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edit Patient | Life Point Medical Centre EMR",
};

export const dynamic = 'force-dynamic';

export default function EditPatientsPage() {
  return (
    <>
      <EditPatientComponent />
    </>
  );
}
