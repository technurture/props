
import LockScreenComponent from "@/components/authentication/lock-screen/lockScreen";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lock Screen | Life Point Medical Centre EMR",
};


export default function LockScreen(){
    return(
        <>
            <LockScreenComponent />s
        </>
    )
}