import ServiceChargesComponent from "@/components/manage/service-charges/ServiceCharges";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Service Charges | NuncCare EMR",
};

export default function ServiceChargesPage() {
  return (
    <>
      <ServiceChargesComponent />
    </>
  );
}
