
import EditDoctorsComponent from "@/components/doctors/editDoctors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edit doctors | Life Point Medical Centre EMR",
};

export const dynamic = 'force-dynamic';

export default function EditDoctorsPage() {
  return (
    <>
      <EditDoctorsComponent />
    </>
  );
}
