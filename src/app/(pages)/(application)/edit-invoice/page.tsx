
import EditInvoiceComponent from "@/components/application/editInvoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Edit Invoice | Life Point Medical Centre EMR",
};

export default function EditInvoicePage() {
  return (
    <>
      <EditInvoiceComponent />
    </>
  );
}
