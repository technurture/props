
import EmailDetailsComponent from "@/components/application/emailDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email Details | NuncCare EMR",
};

export default function EmailDetailsPage() {
  return (
    <>
      <EmailDetailsComponent />
    </>
  );
}
