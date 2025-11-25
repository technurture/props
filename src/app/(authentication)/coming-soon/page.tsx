import ComingSoonComponent from "@/components/authentication/coming-soon/comingSoon";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming soon | Life Point Medical Centre EMR",
};


export default function StarterPage(){
    return(
        <>
            <ComingSoonComponent />
        </>
    )
}