import ChatComponent from "@/components/application/chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Chat | NuncCare EMR",
};

export default function ChatPage() {
  return (
    <>
      <ChatComponent />
    </>
  );
}
