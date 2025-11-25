import SecuritySettingsComponent from "@/components/manage/settings/securitySettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settiings | Life Point Medical Centre EMR",
};


export default function SecuritySettings(){
    return(
        <>
            <SecuritySettingsComponent />
        </>
    )
}