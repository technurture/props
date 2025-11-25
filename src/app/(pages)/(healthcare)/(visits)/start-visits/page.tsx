import { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const StartVisitsComponent = dynamic(() => import("@/components/visits/startVisits"));

export const metadata: Metadata = {
  title:
    "Start Visits | Life Point Medical Centre EMR",
};

export default function StartVisitsPage() {
  return (
    <Suspense fallback={<div className="page-wrapper"><div className="content"><div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div></div></div>}>
      <StartVisitsComponent />
    </Suspense>
  );
}
