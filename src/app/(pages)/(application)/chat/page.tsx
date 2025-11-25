import ChatComponent from "@/components/application/chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Chat | Life Point Medical Centre EMR",
};

export default function ChatPage() {
  return (
    <>
      <ChatComponent />
    </>
  );
}
