import ContactsComponent from "@/components/application/contacts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Contacts | Life Point Medical Centre EMR",
};

export default function ContactsPage() {
  return (
    <>
      <ContactsComponent />
    </>
  );
}
