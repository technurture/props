import UnderMaintenanceComponent from "@/components/authentication/under-maintenance/underMaintenance";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance | NuncCare EMR",
};


export default function underMaintenance(){
    return(
        <>
            <UnderMaintenanceComponent />
        </>
    )
}