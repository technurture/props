import StaffDirectory from "@/components/staff-directory/StaffDirectory";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Directory | Life Point Medical Centre EMR",
};

export default function StaffDirectoryPage() {
  return <StaffDirectory />;
}
