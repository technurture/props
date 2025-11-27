import DashboardComponent from "@/components/dashboard/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | NuncCare EMR",
};


export default function layoutDark(){
    return(
        <>
            <DashboardComponent />
        </>
    )
}