import StaffsComponent from "@/components/manage/staffs/staffs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Staffs | NuncCare EMR",
};

export default function StaffsPage() {
  return (
    <>
      <StaffsComponent />
    </>
  );
}
