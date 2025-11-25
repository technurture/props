import NotificationsSettingsComponent from "@/components/manage/settings/notificationsSettings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications Settings | Life Point Medical Centre EMR",
};


export default function NotificationsSettings(){
    return(
        <>
            <NotificationsSettingsComponent />
        </>
    )
}