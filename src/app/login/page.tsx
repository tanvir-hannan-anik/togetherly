import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { Loading } from "@/components/Feedback";

export const metadata = { title: "Login" };

export default function Page() {
  return <main id="main-content" className="container page"><Suspense fallback={<Loading />}><AuthForm /></Suspense></main>;
}
