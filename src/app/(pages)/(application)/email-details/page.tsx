
import EmailDetailsComponent from "@/components/application/emailDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email Details | Life Point Medical Centre EMR",
};

export default function EmailDetailsPage() {
  return (
    <>
      <EmailDetailsComponent />
    </>
  );
}
