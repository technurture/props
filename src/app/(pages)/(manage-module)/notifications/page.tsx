
import NotificationsComponent from "@/components/manage/notifications/notifications";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification | Life Point Medical Centre EMR",
};


export default function Notifications(){
    return(
        <>
            <NotificationsComponent />
        </>
    )
}