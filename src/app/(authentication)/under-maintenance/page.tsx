import UnderMaintenanceComponent from "@/components/authentication/under-maintenance/underMaintenance";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance | Life Point Medical Centre EMR",
};


export default function underMaintenance(){
    return(
        <>
            <UnderMaintenanceComponent />
        </>
    )
}