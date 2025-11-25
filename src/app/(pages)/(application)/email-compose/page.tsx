
import EmailComposeComponent from "@/components/application/emailCompose";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Email Compose | Life Point Medical Centre EMR",
};

export default function EmailComposePage() {
  return (
    <>
      <EmailComposeComponent />
    </>
  );
}
