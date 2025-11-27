import SecuritySettingsComponent from "@/components/manage/settings/securitySettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settiings | NuncCare EMR",
};


export default function SecuritySettings(){
    return(
        <>
            <SecuritySettingsComponent />
        </>
    )
}