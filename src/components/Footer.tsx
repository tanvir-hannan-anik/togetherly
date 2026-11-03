"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const email = new FormData(form).get("email");
      const result = await api<{ message: string }>("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
      setMessage(result.message);
      form.reset();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <footer className="site-footer"><div className="container footer-grid">
    <div><Link href="/" aria-label="Togetherly home"><Image src="/image/Togetherly Community Leaf Logo-1.png" alt="Togetherly" width={148} height={50} className="footer-logo" /></Link><p>Small actions. Stronger communities.<br />Let’s make a difference, together.</p></div>
    <nav aria-label="Footer navigation"><h2>Get involved</h2><Link href="/events">Explore events</Link><Link href="/events/create">Create an event</Link><Link href="/impact">Our impact</Link><Link href="/joined-events">Joined events</Link></nav>
    <div><h2>A little good in your inbox</h2><p>Join our community mailing list.</p><form className="newsletter" onSubmit={subscribe}><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" placeholder="Your email address" required maxLength={254} /><Button type="submit" disabled={busy} aria-label="Subscribe to the mailing list">{busy ? "…" : <ArrowRight size={18} />}</Button></form><p role="status" className="success-text">{message}</p>{error && <p role="alert" className="error-text">{error}</p>}</div>
  </div><div className="container footer-bottom"><span>Togetherly · Made for a kinder world.</span><span>Local action. Lasting impact.</span></div></footer>;
}
