
import LockScreenComponent from "@/components/authentication/lock-screen/lockScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lock Screen | NuncCare EMR",
};


export default function LockScreen(){
    return(
        <>
            <LockScreenComponent />s
        </>
    )
}