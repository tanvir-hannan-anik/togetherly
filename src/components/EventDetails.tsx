"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Share2,
  Check,
  Pencil,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useApi } from "@/hooks/useApi";
import type { CommunityEvent } from "@/lib/types";
import { api, errorMessage, formatDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/Feedback";
import EventImage from "@/components/EventImage";
import DeleteEventButton from "@/components/DeleteEventButton";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id;
  const {
    data: event,
    loading,
    error,
    reload,
  } = useApi<CommunityEvent>(
    isPending ? null : `/events/${id}?viewer=${userId || "guest"}`,
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");

  async function toggleJoin() {
    if (!event) return;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      const result = await api<{ message: string }>(`/events/${id}/join`, {
        method: event.joined ? "DELETE" : "POST",
      });
      setMessage(result.message);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/events/${id}`,
      );
      setMessage("Event link copied. Share a little good!");
    } catch {
      setActionError(
        "The link could not be copied. You can copy it from your browser’s address bar.",
      );
    }
  }

  if (loading) return <Loading label="Loading event details…" />;
  if (error) return <ErrorMessage message={error} retry={reload} />;
  if (!event) return <ErrorMessage message="This event could not be found." />;
  const isOwner = !!userId && userId === event.organizerId;
  const isPast = new Date(event.date) <= new Date();

  return (
    <>
      <Link href="/events" className="text-link back-link">
        <ArrowLeft size={17} />
        Back to upcoming events
      </Link>
      <div className="detail-heading">
        <div>
          <span className="badge">{event.type}</span>
          <h1>{event.title}</h1>
          <p className="muted">Organized by {event.organizerName}</p>
        </div>
        <Button variant="outline" onClick={share}>
          <Share2 size={16} />
          Share event
        </Button>
      </div>
      <div className="detail-layout">
        <div>
          <EventImage
            src={event.thumbnail}
            alt={event.title}
            className="detail-image"
          />
          <section className="about-event">
            <h2>About this event</h2>
            <p className="description-text">{event.description}</p>
          </section>
          <section className="organizer-panel">
            <span className="user-avatar">
              {event.organizerName.charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="eyebrow">Your community organizer</p>
              <h3>{event.organizerName}</h3>
            </div>
          </section>
        </div>
        <aside className="detail-sidebar">
          <h2>A little time. A real difference.</h2>
          <p className="muted">Here’s everything you need to show up.</p>
          <dl className="event-facts">
            <div>
              <CalendarDays size={20} />
              <div>
                <dt>Date</dt>
                <dd>{formatDate(event.date)}</dd>
              </div>
            </div>
            <div>
              <Clock size={20} />
              <div>
                <dt>Time & duration</dt>
                <dd>
                  {new Date(event.date).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}{" "}
                  · {event.duration} hours
                </dd>
              </div>
            </div>
            <div>
              <MapPin size={20} />
              <div>
                <dt>Meeting point</dt>
                <dd>{event.location}</dd>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  View on map
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
            <div>
              <Users size={20} />
              <div>
                <dt>Community</dt>
                <dd>
                  {event.participantCount}{" "}
                  {event.participantCount === 1 ? "volunteer" : "volunteers"}{" "}
                  joined
                </dd>
              </div>
            </div>
          </dl>
          {isOwner ? (
            <div className="owner-actions">
              <p className="muted">You’re the organizer of this event.</p>
              {!isPast && (
                <Link href={`/events/${id}/edit`} className="button-link">
                  <Pencil size={16} />
                  Edit event
                </Link>
              )}
              <DeleteEventButton
                id={id}
                title={event.title}
                onDeleted={() => router.replace("/my-events")}
              />
            </div>
          ) : isPast ? (
            <p className="status-pill">This event has already started.</p>
          ) : userId ? (
            <>
              <Button
                className="form-submit"
                disabled={busy}
                variant={event.joined ? "outline" : "default"}
                onClick={toggleJoin}
              >
                {busy
                  ? "Updating…"
                  : event.joined
                    ? "Leave event"
                    : "Join this event"}
                {!event.joined && <ArrowUpRight size={17} />}
              </Button>
              {event.joined && (
                <p className="joined-notice">
                  <Check size={16} />
                  You’re on the list. See you there!
                </p>
              )}
            </>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/events/${id}`)}`}
              className="button-link"
            >
              Log in to join
              <ArrowUpRight size={17} />
            </Link>
          )}
          {actionError && <ErrorMessage message={actionError} />}
          {message && (
            <p className="success-text" role="status">
              {message}
            </p>
          )}
          <p className="sidebar-note">
            A stronger community starts with people like you.
          </p>
        </aside>
      </div>
    </>
  );
}
