import DoctorsComponent from "@/components/doctors/doctors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Doctors | Life Point Medical Centre EMR",
};

export default function DoctorsPage() {
  return (
    <>
      <DoctorsComponent />
    </>
  );
}
