import SignUpComponent from "@/components/authentication/register/signUp";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | NuncCare EMR",
};


export default function Sign(){
    return(
        <>
            <SignUpComponent />
        </>
    )
}