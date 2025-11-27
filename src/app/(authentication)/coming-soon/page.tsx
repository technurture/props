import ComingSoonComponent from "@/components/authentication/coming-soon/comingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming soon | NuncCare EMR",
};


export default function StarterPage(){
    return(
        <>
            <ComingSoonComponent />
        </>
    )
}