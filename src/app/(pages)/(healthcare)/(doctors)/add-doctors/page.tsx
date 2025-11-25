import AddDoctorsComponent from "@/components/doctors/addDoctors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Add doctors | Life Point Medical Centre EMR",
};

export default function AddDoctorsPage() {
  return (
    <>
      <AddDoctorsComponent />
    </>
  );
}
