"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Newsletter() {
  const [busy, setBusy] = useState(false);

  async function subscribe(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    const form = submission.currentTarget;
    setBusy(true);
    try {
      const result = await api<{ message: string }>("/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: new FormData(form).get("email") }),
      });
      toast.success(result.message);
      form.reset();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="container section-space newsletter-section"
      aria-labelledby="newsletter-heading"
    >
      <Mail size={36} strokeWidth={1.4} />
      <p className="eyebrow">Stay in the loop</p>
      <h2 id="newsletter-heading">A little good in your inbox</h2>
      <p className="muted">
        New causes near you, once a month. No spam, ever.
      </p>
      <form className="newsletter-form" onSubmit={subscribe}>
        <label className="sr-only" htmlFor="newsletter-email">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          maxLength={254}
          required
        />
        <Button type="submit" disabled={busy}>
          {busy ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
    </section>
  );
}
