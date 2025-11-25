import StaffsComponent from "@/components/manage/staffs/staffs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Staffs | Life Point Medical Centre EMR",
};

export default function StaffsPage() {
  return (
    <>
      <StaffsComponent />
    </>
  );
}
