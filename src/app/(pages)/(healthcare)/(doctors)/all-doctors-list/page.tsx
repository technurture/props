
import AllDoctorsListComponent from "@/components/doctors/allDoctorsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "All doctors list | NuncCare EMR",
};

export default function AllDoctorsListPage() {
  return (
    <>
      <AllDoctorsListComponent />
    </>
  );
}
