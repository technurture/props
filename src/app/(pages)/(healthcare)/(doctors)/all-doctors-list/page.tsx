
import AllDoctorsListComponent from "@/components/doctors/allDoctorsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "All doctors list | Life Point Medical Centre EMR",
};

export default function AllDoctorsListPage() {
  return (
    <>
      <AllDoctorsListComponent />
    </>
  );
}
