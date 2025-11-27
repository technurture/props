import AdmissionsComponent from "@/components/admissions/admissions";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admissions | NuncCare EMR",
};

export default function AdmissionsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdmissionsComponent />
    </Suspense>
  );
}
