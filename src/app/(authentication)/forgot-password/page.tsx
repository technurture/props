
import ForgotPasswordComponent from "@/components/authentication/forgot-password/forgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password | Life Point Medical Centre EMR",
};

export default function ForgotPasswordPage(){
    return(
        <>
            <ForgotPasswordComponent />
        </>
    )
}