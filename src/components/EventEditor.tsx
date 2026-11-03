"use client";

import { useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useApi } from "@/hooks/useApi";
import type { CommunityEvent } from "@/lib/types";
import { ErrorMessage, Loading } from "@/components/Feedback";
import EventForm from "@/components/EventForm";

export default function EventEditor() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = authClient.useSession();
  const { data, error, loading, reload } = useApi<CommunityEvent>(
    isPending ? null : `/events/${id}`,
  );
  if (loading) return <Loading label="Loading your event…" />;
  if (error) return <ErrorMessage message={error} retry={reload} />;
  if (!data || data.organizerId !== session?.user.id)
    return <ErrorMessage message="Only the organizer can edit this event." />;
  if (new Date(data.date) <= new Date())
    return (
      <ErrorMessage message="Events that have already started cannot be edited." />
    );
  return <EventForm event={data} />;
}
