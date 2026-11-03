import { Suspense } from "react";
import EventDetails from "@/components/EventDetails";
import { Loading } from "@/components/Feedback";

export const metadata = { title: "Event Details" };

export default function Page() {
  return <main id="main-content" className="container page"><Suspense fallback={<Loading />}><EventDetails /></Suspense></main>;
}
