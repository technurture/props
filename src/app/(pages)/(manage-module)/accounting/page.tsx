import AccountingComponent from "@/components/manage/accounting/accounting";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounting | Life Point Medical Centre - EMR System",
};

export default function AccountingPage() {
  return (
    <>
      <AccountingComponent />
    </>
  );
}
