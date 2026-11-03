"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { CommunityEvent } from "@/lib/types";
import EventCard from "@/components/event/event-card";
import { EmptyState, ErrorMessage, Loading } from "@/components/feedback";

export default function UpcomingEvents() {
  const { data, loading, error, reload } =
    useApi<CommunityEvent[]>("/events?limit=6");
  return (
    <section className="container section-space">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Find your next small act</p>
          <h2>Upcoming events</h2>
          <p className="muted">
            Good people. Meaningful causes. A place for you.
          </p>
        </div>
        <Link className="text-link" href="/events">
          View all events
          <ArrowRight size={17} />
        </Link>
      </div>
      {loading ? (
        <Loading label="Finding upcoming events…" />
      ) : error ? (
        <ErrorMessage message={error} retry={reload} />
      ) : data?.length ? (
        <div className="events-grid">
          {data.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState title="Your community’s next chapter starts here">
          <p>
            No upcoming events yet. Bring people together for a cause you care
            about.
          </p>
          <Link href="/events/create" className="button-link">
            Create the first event
          </Link>
        </EmptyState>
      )}
    </section>
  );
}
