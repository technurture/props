import { Metadata } from "next";
import BillingDepartmentComponent from "@/components/manage/billing/BillingDepartment";

export const metadata: Metadata = {
  title: "Billing Department | Life Point Medical Centre - EMR System",
  description: "Manage billing records and invoices",
};

export default function BillingDepartmentPage() {
  return <BillingDepartmentComponent />;
}
