import SignUpComponent from "@/components/authentication/register/signUp";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | Life Point Medical Centre EMR",
};


export default function Sign(){
    return(
        <>
            <SignUpComponent />
        </>
    )
}