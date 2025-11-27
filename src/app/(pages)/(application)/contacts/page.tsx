import ContactsComponent from "@/components/application/contacts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Contacts | NuncCare EMR",
};

export default function ContactsPage() {
  return (
    <>
      <ContactsComponent />
    </>
  );
}
