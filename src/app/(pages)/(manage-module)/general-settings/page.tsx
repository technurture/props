import GeneralSettingsComponent from "@/components/manage/settings/generalSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings | Life Point Medical Centre - EMR System",
};

export default function GeneralSettings(){
    return(
        <>
            <GeneralSettingsComponent />
        </>
    )
}
