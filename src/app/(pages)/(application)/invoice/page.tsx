import InvoiceComponent from "@/components/application/invoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Invoice | Life Point Medical Centre EMR",
};

export default function InvoicePage() {
  return (
    <>
      <InvoiceComponent />
    </>
  );
}
