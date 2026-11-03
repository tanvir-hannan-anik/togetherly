"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import type { CommunityEvent } from "@/lib/types";
import EventCard from "@/components/event/event-card";
import DeleteEventButton from "@/components/event/delete-event-dialog";
import { EmptyState, ErrorMessage, Loading } from "@/components/feedback";
import { Button } from "@/components/ui/button";

export default function PersonalEvents({
  joined = false,
}: {
  joined?: boolean;
}) {
  const { data, error, loading, reload } = useApi<CommunityEvent[]>(
    joined ? "/joined-events" : "/my-events",
  );
  const [filter, setFilter] = useState("all");
  if (loading)
    return (
      <Loading
        label={joined ? "Loading your joined events…" : "Loading your events…"}
      />
    );
  if (error) return <ErrorMessage message={error} retry={reload} />;
  const events =
    data?.filter(
      (event) =>
        filter === "all" ||
        (filter === "upcoming"
          ? new Date(event.date) > new Date()
          : new Date(event.date) <= new Date()),
    ) || [];

  return (
    <>
      <div className="event-tabs" aria-label="Filter your events">
        {["all", "upcoming", "past"].map((value) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "ghost"}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value === "all"
              ? "All events"
              : value === "upcoming"
                ? "Upcoming"
                : "Past events"}
          </Button>
        ))}
      </div>
      {events.length ? (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event._id} event={event}>
              {!joined && (
                <div className="card-actions">
                  {new Date(event.date) > new Date() && (
                    <Link
                      className="text-link"
                      href={`/events/${event._id}/edit`}
                    >
                      <Pencil size={15} />
                      Edit
                    </Link>
                  )}
                  <DeleteEventButton
                    id={event._id}
                    title={event.title}
                    onDeleted={reload}
                  />
                </div>
              )}
              {joined && (
                <p className="joined-notice">
                  {new Date(event.date) > new Date()
                    ? "You’re on the list. View details to manage your place."
                    : "Thank you for being part of this community."}
                </p>
              )}
            </EventCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            joined
              ? "Your next good thing is waiting"
              : "Bring your community together"
          }
        >
          <p>
            {filter !== "all"
              ? "You don’t have any events in this category yet."
              : joined
                ? "Join an event and find it here, with all the details you need."
                : "Events you organize will appear here. Start with a cause you care about."}
          </p>
          <Link
            className="button-link"
            href={joined ? "/events" : "/events/create"}
          >
            {joined ? "Explore events" : "Create an event"}
          </Link>
        </EmptyState>
      )}
    </>
  );
}
