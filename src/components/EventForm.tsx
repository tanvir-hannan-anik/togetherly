"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/Feedback";
import { useApi } from "@/hooks/useApi";
import { api, errorMessage } from "@/lib/api";
import type { CommunityEvent } from "@/lib/types";

function localDateTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function EventForm({ event }: { event?: CommunityEvent }) {
  const router = useRouter();
  const types = useApi<string[]>("/event-types");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    setError("");
    const fields = Object.fromEntries(new FormData(submission.currentTarget));
    const date = new Date(String(fields.date));
    if (!Number.isFinite(date.getTime()) || date <= new Date()) { setError("Choose a future date and time."); return; }
    setBusy(true);
    try {
      const result = await api<{ _id?: string }>(event ? `/events/${event._id}` : "/events", {
        method: event ? "PATCH" : "POST",
        body: JSON.stringify({ ...fields, date: date.toISOString(), duration: Number(fields.duration) }),
      });
      router.push(`/events/${event?._id || result._id}?saved=1`);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  if (types.loading) return <Loading label="Preparing your event form…" />;
  if (types.error) return <ErrorMessage message={types.error} retry={types.reload} />;

  return <div className="form-layout"><form className="form-stack form-panel" onSubmit={handleSubmit}>
    <label>Event title *<input name="title" defaultValue={event?.title} minLength={5} maxLength={150} placeholder="Give your event a clear, welcoming name" required /></label>
    <label>Event type *<select name="type" defaultValue={event?.type || ""} required><option value="" disabled>Choose an event type</option>{types.data?.map((type) => <option key={type}>{type}</option>)}</select></label>
    <label>Thumbnail image URL *<input name="thumbnail" type="url" defaultValue={event?.thumbnail} maxLength={2000} placeholder="https://example.com/your-event-photo.jpg" required /><span className="field-help">Use a publicly accessible photo that represents your event.</span></label>
    <label>Location *<input name="location" defaultValue={event?.location} minLength={3} maxLength={200} placeholder="Meeting point, neighborhood, and city" required /></label>
    <div className="form-row"><label>Event date and time *<input name="date" type="datetime-local" defaultValue={event ? localDateTime(event.date) : ""} onFocus={(input) => { input.currentTarget.min = localDateTime(new Date().toISOString()); }} required /><span className="field-help">Enter the time in your local timezone.</span></label><label>Duration (hours) *<input name="duration" type="number" min="0.5" max="24" step="0.5" defaultValue={event?.duration} placeholder="e.g. 2" required /></label></div>
    <label>Description *<textarea name="description" rows={6} defaultValue={event?.description} minLength={20} maxLength={5000} placeholder="Tell volunteers about the cause, the plan, and what to bring…" required /></label>
    {error && <ErrorMessage message={error} />}
    <div className="form-actions"><Link className="button-link outline" href={event ? `/events/${event._id}` : "/my-events"}>Cancel</Link><Button type="submit" disabled={busy} className="form-submit">{busy ? "Saving…" : event ? "Save changes" : "Publish event"}<ArrowRight size={16} /></Button></div>
  </form><aside className="tips-panel"><Sprout size={32} strokeWidth={1.5} /><h2>A great event begins with a plan</h2><p>Choose a clear title, add a helpful description, and set a future date so volunteers know what to expect.</p><ul>{["Your event appears in Upcoming Events", "Volunteers can join from the details page", "You can edit or delete your own event"].map((tip) => <li key={tip}><Check size={16} />{tip}</li>)}</ul><p className="tips-note">Every good thing starts with someone who cares. That someone could be you.</p></aside></div>;
}
