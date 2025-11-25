import React, { Suspense } from "react";
import InsurancePatientData from "@/components/manage/insurance/InsurancePatientData";

const InsurancePatientDataPage = () => {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="content"><div className="text-center py-5">Loading...</div></div></div>}>
      <InsurancePatientData />
    </Suspense>
  );
};

export default InsurancePatientDataPage;
