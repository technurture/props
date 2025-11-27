import DoctorDetailsComponent from "@/components/doctors/doctorDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Doctors Details | NuncCare EMR",
};

export const dynamic = 'force-dynamic';

export default function DoctorsDetailsPage() {
  return (
    <>
      <DoctorDetailsComponent />
    </>
  );
}
