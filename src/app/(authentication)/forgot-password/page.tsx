
import ForgotPasswordComponent from "@/components/authentication/forgot-password/forgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password | NuncCare EMR",
};

export default function ForgotPasswordPage(){
    return(
        <>
            <ForgotPasswordComponent />
        </>
    )
}