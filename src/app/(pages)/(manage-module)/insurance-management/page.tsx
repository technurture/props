import { Metadata } from "next";
import InsuranceManagement from "@/components/manage/insurance/InsuranceManagement";

export const metadata: Metadata = {
  title: "Insurance Management | NuncCare",
  description: "Manage insurance providers and plans",
};

const InsuranceManagementPage = () => {
  return <InsuranceManagement />;
};

export default InsuranceManagementPage;
