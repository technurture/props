
import AddInvoiceComponent from "@/components/application/addInvoice";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Add Invoice | Life Point Medical Centre EMR",
};

export default function AddInvoicePage() {
  return (
    <>
      <AddInvoiceComponent />
    </>
  );
}
