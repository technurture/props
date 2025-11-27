
import EditInvoiceComponent from "@/components/application/editInvoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edit Invoice | NuncCare EMR",
};

export default function EditInvoicePage() {
  return (
    <>
      <EditInvoiceComponent />
    </>
  );
}
