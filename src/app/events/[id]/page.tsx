import { Suspense } from "react";
import EventDetails from "@/components/event/event-details";
import { Loading } from "@/components/feedback";

export const metadata = { title: "Event Details" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <Suspense fallback={<Loading />}>
        <EventDetails />
      </Suspense>
    </main>
  );
}
