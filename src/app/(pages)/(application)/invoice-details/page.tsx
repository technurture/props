

import InvoiceDetailsComponent from "@/components/application/invoiceDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Invoice Details | NuncCare EMR",
};

export const dynamic = 'force-dynamic';

export default function InvoiceDetailsPage() {
  return (
    <>
      <InvoiceDetailsComponent />
    </>
  );
}
