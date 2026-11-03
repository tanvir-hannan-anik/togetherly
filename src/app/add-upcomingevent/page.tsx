"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";

const inputClassName =
  "mt-1 w-full rounded-lg border border-transparent bg-transparent px-2 py-2.5 text-xs text-[#123c30] outline-none placeholder:text-[#81958b] focus:border-[#24734f] focus:ring-2 focus:ring-[#24734f]/15 dark:text-[#f8f7f2] dark:placeholder:text-[#a1b9ad]";

function getTomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AddUpcomingEventPage() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dateInput = form.elements.namedItem("date") as HTMLInputElement;

    if (dateInput.value < getTomorrow()) {
      dateInput.setCustomValidity("Please select a future date.");
      dateInput.reportValidity();
      return;
    }

    setMessage(
      "Your event details are ready. Publishing is not connected yet, so your event has not been saved or published.",
    );
  }

  return (
    <main className="flex-1 bg-[#f8f7f2] px-5 py-7 font-[family-name:var(--font-geist-sans)] text-[#123c30] sm:px-9 dark:bg-[#132c24] dark:text-[#f8f7f2]">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-semibold uppercase text-[#24734f] dark:text-[#e1f28b]">
          Organize a positive change
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[32px]">
          Create a community event
        </h1>
        <p className="mt-2 text-xs text-[#7b9186] dark:text-[#b8cec2]">
          Bring people together for a cause that matters. Fields marked * are required.
        </p>

        <div className="mt-6 grid items-start gap-[18px] sm:grid-cols-[2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            onChange={() => setMessage("")}
            className="space-y-3 rounded-[16px] bg-white px-5 py-6 dark:bg-[#204638]"
          >
            <div>
              <label htmlFor="event-title" className="text-[11px] font-semibold">
                Event title *
              </label>
              <input
                id="event-title"
                name="title"
                required
                maxLength={150}
                pattern=".*\S.*"
                placeholder="e.g. Clean up Dhanmondi Lake"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="event-type" className="text-[11px] font-semibold">
                Event type *
              </label>
              <select
                id="event-type"
                name="type"
                required
                defaultValue=""
                className={`${inputClassName} cursor-pointer bg-white invalid:text-[#81958b] dark:bg-[#204638]`}
              >
                <option value="" disabled>
                  Choose: Cleanup / Plantation / Donation / Other
                </option>
                <option value="cleanup">Cleanup</option>
                <option value="plantation">Plantation</option>
                <option value="donation">Donation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="event-thumbnail" className="text-[11px] font-semibold">
                Thumbnail image URL *
              </label>
              <input
                id="event-thumbnail"
                name="thumbnail"
                type="url"
                required
                pattern="https?://.+"
                title="Enter an image URL starting with https:// or http://"
                placeholder="https://images.example.com/event.jpg"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="event-location" className="text-[11px] font-semibold">
                Location *
              </label>
              <input
                id="event-location"
                name="location"
                required
                pattern=".*\S.*"
                placeholder="e.g. Mirpur 10, Dhaka"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="event-date" className="text-[11px] font-semibold">
                Event date *
              </label>
              <input
                id="event-date"
                name="date"
                type="date"
                required
                aria-label="Event date (select a future date)"
                onFocus={(event) => {
                  event.currentTarget.min = getTomorrow();
                }}
                onChange={(event) => event.currentTarget.setCustomValidity("")}
                className={`${inputClassName} scheme-light dark:scheme-dark`}
              />
            </div>
            <div>
              <label htmlFor="event-description" className="text-[11px] font-semibold">
                Description *
              </label>
              <textarea
                id="event-description"
                name="description"
                required
                rows={4}
                placeholder="Tell volunteers about the cause, plan, and what to bring..."
                className={`${inputClassName} min-h-[100px] resize-y bg-[#f8f7f2] px-3 dark:bg-[#173b2e]`}
              />
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex min-h-11 w-full cursor-pointer items-center gap-1.5 rounded-[9px] bg-[#24734f] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#1d6042] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#24734f] dark:focus-visible:outline-[#e1f28b]"
            >
              Publish event <ArrowRight size={14} aria-hidden="true" />
            </button>
            <p role="status" className="text-xs leading-relaxed empty:hidden">
              {message}
            </p>
          </form>

          <aside
            aria-labelledby="event-tips-heading"
            className="rounded-[16px] bg-[#eaf3e7] px-5 py-7 md:min-h-[240px] dark:bg-[#294c3b]"
          >
            <h2 id="event-tips-heading" className="max-w-[230px] text-lg font-bold leading-tight">
              A great event begins with a plan
            </h2>
            <p className="mt-2 max-w-[250px] text-xs leading-[1.4] text-[#7b9186] dark:text-[#b8cec2]">
              Choose a clear title, add a helpful description, and set a future
              date so volunteers know what to expect.
            </p>
            <ul className="mt-6 space-y-0.5 text-[11px] leading-snug text-[#33835d] dark:text-[#d0e6ba]">
              {[
                "Your event appears in Upcoming Events",
                "Volunteers can join from the details page",
                "You can edit or delete your own event",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-1">
                  <Check size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
