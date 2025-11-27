
import ContactListComponent from "@/components/application/contactList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Contact List | NuncCare EMR",
};

export default function ContactListePage() {
  return (
    <>
      <ContactListComponent />
    </>
  );
}
