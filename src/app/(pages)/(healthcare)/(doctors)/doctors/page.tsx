import DoctorsComponent from "@/components/doctors/doctors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Doctors | NuncCare EMR",
};

export default function DoctorsPage() {
  return (
    <>
      <DoctorsComponent />
    </>
  );
}
