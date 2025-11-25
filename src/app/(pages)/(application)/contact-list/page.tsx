
import ContactListComponent from "@/components/application/contactList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Contact List | Life Point Medical Centre EMR",
};

export default function ContactListePage() {
  return (
    <>
      <ContactListComponent />
    </>
  );
}
