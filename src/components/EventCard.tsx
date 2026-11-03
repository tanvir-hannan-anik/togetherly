import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import EventImage from "@/components/EventImage";
import { formatDate } from "@/lib/api";
import type { CommunityEvent } from "@/lib/types";

export default function EventCard({
  event,
  children,
}: {
  event: CommunityEvent;
  children?: React.ReactNode;
}) {
  return (
    <Card className="event-card">
      <Link
        href={`/events/${event._id}`}
        className="event-image-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <EventImage src={event.thumbnail} alt="" className="event-image" />
        <span className="badge">{event.type}</span>
      </Link>
      <CardContent className="event-card-body">
        <p className="event-meta">
          <CalendarDays size={15} />
          {formatDate(event.date)}
        </p>
        <h3>
          <Link href={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p className="event-meta">
          <MapPin size={15} />
          {event.location}
        </p>
        <div className="event-card-bottom">
          <span className="event-meta">
            <Users size={15} />
            {event.participantCount} joined
          </span>
          <Link className="text-link" href={`/events/${event._id}`}>
            View details <ArrowUpRight size={16} />
          </Link>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
