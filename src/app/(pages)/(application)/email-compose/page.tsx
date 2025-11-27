
import EmailComposeComponent from "@/components/application/emailCompose";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email Compose | NuncCare EMR",
};

export default function EmailComposePage() {
  return (
    <>
      <EmailComposeComponent />
    </>
  );
}
