import Error500Component from "@/components/authentication/error-500/error500";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error 500 | NuncCare EMR",
};


export default function Error500(){
    return(
        <>
            <Error500Component />
        </>
    )
}