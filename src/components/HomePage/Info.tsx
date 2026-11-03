"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import type { CommunityStats } from "@/lib/types";
import { ErrorMessage, Loading } from "@/components/Feedback";

export default function Info() {
  const { data, loading, error, reload } = useApi<CommunityStats>("/stats");
  return (
    <div className="container home-info">
      <section aria-labelledby="community-heading">
        <h2 id="community-heading" className="eyebrow">
          Our community at a glance
        </h2>
        {loading ? (
          <Loading label="Loading community impact…" />
        ) : error ? (
          <ErrorMessage message={error} retry={reload} />
        ) : (
          data && (
            <dl className="stats-grid">
              <div>
                <dd>{data.events.toLocaleString()}</dd>
                <dt>Community events</dt>
              </div>
              <div>
                <dd>{data.volunteers.toLocaleString()}</dd>
                <dt>Helping hands</dt>
              </div>
              <div>
                <dd>{data.neighborhoods.toLocaleString()}</dd>
                <dt>Event locations</dt>
              </div>
            </dl>
          )
        )}
      </section>
      <section
        className="section-space"
        aria-labelledby="participation-heading"
      >
        <h2 id="participation-heading">Do good, together.</h2>
        <p className="muted">Explore the causes you care about.</p>
        <ol className="steps-grid">
          <li>
            <Link href="/events">
              <span>01</span>Discover local causes
              <ArrowUpRight size={18} />
            </Link>
          </li>
          <li>
            <Link href="/events">
              <span>02</span>Join with one click
              <ArrowUpRight size={18} />
            </Link>
          </li>
          <li>
            <Link href="/impact">
              <span>03</span>See your impact
              <ArrowUpRight size={18} />
            </Link>
          </li>
        </ol>
      </section>
    </div>
  );
}
