import EmailComponent from "@/components/application/email";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email | Life Point Medical Centre EMR",
};

export default function EmailPage() {
  return (
    <>
      <EmailComponent />
    </>
  );
}
