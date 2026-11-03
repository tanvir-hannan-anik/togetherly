"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  HeartHandshake,
  MapPin,
  CalendarDays,
  CircleCheck,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import type { CommunityStats } from "@/lib/types";
import { EmptyState, ErrorMessage, Loading } from "@/components/Feedback";

export default function Impact() {
  const { data, error, loading, reload } = useApi<CommunityStats>("/stats");
  if (loading) return <Loading label="Gathering our community’s impact…" />;
  if (error) return <ErrorMessage message={error} retry={reload} />;
  if (!data) return null;

  const statistics = [
    { value: data.events, label: "Community events", icon: CalendarDays },
    { value: data.volunteers, label: "Helping hands", icon: HeartHandshake },
    { value: data.neighborhoods, label: "Event locations", icon: MapPin },
    { value: data.completed, label: "Past events", icon: CircleCheck },
  ];

  return (
    <>
      <div className="impact-stats">
        {statistics.map(({ value, label, icon: Icon }) => (
          <div key={label}>
            <Icon size={25} strokeWidth={1.5} />
            <strong>{value.toLocaleString()}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="impact-causes">
        <p className="eyebrow">Many causes. One community.</p>
        <h2>Where we’re making a difference</h2>
        <p className="muted">
          Events created by our community, grouped by cause.
        </p>
        {data.categories.length ? (
          <div className="cause-list">
            {data.categories.map((category) => (
              <div key={category._id}>
                <div>
                  <span>{category._id}</span>
                  <strong>
                    {category.count} {category.count === 1 ? "event" : "events"}
                  </strong>
                </div>
                <progress
                  value={category.count}
                  max={Math.max(data.events, 1)}
                  aria-label={`${category._id}: ${category.count} events`}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Every community starts with one small act">
            <p>Create an event to start building our shared impact.</p>
          </EmptyState>
        )}
        <p className="field-help">
          Helping hands counts unique people who joined an event. Past events
          are events whose start time has passed; attendance is not
          independently verified.
        </p>
      </section>
      <section className="community-cta">
        <div>
          <h2>Be part of what happens next.</h2>
          <p>A little of your time can mean a lot to someone else.</p>
        </div>
        <Link href="/events" className="button-link lime">
          Find your cause
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
