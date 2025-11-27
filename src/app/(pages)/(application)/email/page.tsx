import EmailComponent from "@/components/application/email";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email | NuncCare EMR",
};

export default function EmailPage() {
  return (
    <>
      <EmailComponent />
    </>
  );
}
