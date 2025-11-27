
import NotificationsComponent from "@/components/manage/notifications/notifications";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification | NuncCare EMR",
};


export default function Notifications(){
    return(
        <>
            <NotificationsComponent />
        </>
    )
}