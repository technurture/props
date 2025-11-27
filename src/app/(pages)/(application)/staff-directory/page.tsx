import StaffDirectory from "@/components/staff-directory/StaffDirectory";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Directory | NuncCare EMR",
};

export default function StaffDirectoryPage() {
  return <StaffDirectory />;
}
