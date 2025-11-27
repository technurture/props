
import PharmacyComponent from "@/components/pharmacy/pharmacy";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Pharmacy | NuncCare EMR",
};

export default function PharmacyPage() {
  return (
    <>
      <PharmacyComponent />
    </>
  );
}
