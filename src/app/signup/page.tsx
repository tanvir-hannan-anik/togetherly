import { Suspense } from "react";
import AuthForm from "@/components/auth-form";
import { Loading } from "@/components/feedback";

export const metadata = { title: "Join the Community" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <Suspense fallback={<Loading />}>
        <AuthForm signup />
      </Suspense>
    </main>
  );
}
