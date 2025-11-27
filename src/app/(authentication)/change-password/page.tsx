import ChangePasswordComponent from "@/components/authentication/change-password/change-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change password | NuncCare EMR",
};


export default function ChangePassword(){
    return(
        <>
            <ChangePasswordComponent />
        </>
    )
}