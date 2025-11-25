import { Metadata } from "next";
import InsuranceManagement from "@/components/manage/insurance/InsuranceManagement";

export const metadata: Metadata = {
  title: "Insurance Management | Life Point Medical Centre",
  description: "Manage insurance providers and plans",
};

const InsuranceManagementPage = () => {
  return <InsuranceManagement />;
};

export default InsuranceManagementPage;
