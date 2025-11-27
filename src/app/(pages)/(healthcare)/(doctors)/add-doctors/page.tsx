import AddDoctorsComponent from "@/components/doctors/addDoctors";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Add doctors | NuncCare EMR",
};

export default function AddDoctorsPage() {
  return (
    <>
      <AddDoctorsComponent />
    </>
  );
}
