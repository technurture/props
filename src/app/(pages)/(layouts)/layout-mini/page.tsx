import DashboardComponent from "@/components/dashboard/dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Life Point Medical Centre EMR",
};


export default function LayoutMini(){
    return(
        <>
            <DashboardComponent />
        </>
    )
}