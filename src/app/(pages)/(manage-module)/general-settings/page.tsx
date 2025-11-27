import GeneralSettingsComponent from "@/components/manage/settings/generalSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings | NuncCare - EMR System",
};

export default function GeneralSettings(){
    return(
        <>
            <GeneralSettingsComponent />
        </>
    )
}
