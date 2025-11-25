import { Metadata } from "next";
import BranchManagement from "@/components/manage/branches/BranchManagement";

export const metadata: Metadata = {
  title: "Branch Management | Life Point Medical Centre",
  description: "Manage branches and locations",
};

const BranchManagementPage = () => {
  return <BranchManagement />;
};

export default BranchManagementPage;
