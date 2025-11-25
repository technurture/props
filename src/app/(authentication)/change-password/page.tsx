import ChangePasswordComponent from "@/components/authentication/change-password/change-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change password | Life Point Medical Centre EMR",
};


export default function ChangePassword(){
    return(
        <>
            <ChangePasswordComponent />
        </>
    )
}