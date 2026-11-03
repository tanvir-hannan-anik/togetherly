"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import type { EventResults } from "@/lib/types";
import EventCard from "@/components/EventCard";
import { EmptyState, ErrorMessage, Loading } from "@/components/Feedback";
import { Button } from "@/components/ui/button";

export default function EventBrowser() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("soonest");
  const [page, setPage] = useState(1);
  const types = useApi<string[]>("/event-types");
  const params = new URLSearchParams({
    search,
    type,
    sort,
    page: String(page),
  });
  const { data, loading, error, reload } = useApi<EventResults>(
    `/events?${params}`,
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(query.trim());
    setPage(1);
  }
  function clearFilters() {
    setQuery("");
    setSearch("");
    setType("");
    setSort("soonest");
    setPage(1);
  }

  return (
    <>
      <div className="filter-panel">
        <form className="search-form" onSubmit={handleSearch}>
          <Search size={19} aria-hidden="true" />
          <label className="sr-only" htmlFor="event-search">
            Search events or locations
          </label>
          <input
            id="event-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={150}
            placeholder="Search events or locations…"
          />
          <Button type="submit">Search</Button>
        </form>
        <label className="filter-select">
          <span className="sr-only">Event type</span>
          <select
            aria-label="Event type"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All event types</option>
            {types.data?.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-select">
          <span className="sr-only">Sort events</span>
          <select
            aria-label="Sort events"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            <option value="soonest">Soonest first</option>
            <option value="newest">Recently added</option>
          </select>
        </label>
      </div>
      {types.error && (
        <ErrorMessage
          message="Event types could not be loaded."
          retry={types.reload}
        />
      )}
      <div className="results-heading">
        <p className="muted" role="status">
          {!loading && !error && data
            ? `${data.total} upcoming ${data.total === 1 ? "event" : "events"}`
            : "Explore your community"}
        </p>
        <Link className="text-link" href="/events/create">
          <Plus size={17} />
          Create an event
        </Link>
      </div>
      {loading ? (
        <Loading label="Finding events…" />
      ) : error ? (
        <ErrorMessage message={error} retry={reload} />
      ) : data?.events.length ? (
        <>
          <div className="events-grid">
            {data.events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
          {data.pages > 1 && (
            <nav className="pagination" aria-label="Event pages">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <span>
                Page {page} of {data.pages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </nav>
          )}
        </>
      ) : (
        <EmptyState
          title={
            search || type
              ? "No events match your search"
              : "Something good is on the horizon"
          }
        >
          <p>
            {search || type
              ? "Try another location or explore all event types."
              : "There are no upcoming events yet. Be the first to bring your community together."}
          </p>
          {search || type ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Link href="/events/create" className="button-link">
              Create an event
            </Link>
          )}
        </EmptyState>
      )}
    </>
  );
}
