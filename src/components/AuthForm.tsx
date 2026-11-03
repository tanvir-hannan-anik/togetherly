"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api, errorMessage } from "@/lib/api";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/Feedback";

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const requested = params.get("next") || "/events";
  const next =
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.includes("\\")
      ? requested
      : "/events";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (signup && fields.password !== fields.confirmPassword) {
      setError("Your passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const result = await api<User>(signup ? "/auth/signup" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(fields),
      });
      setUser(result);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <HeartHandshake size={44} strokeWidth={1.3} />
        <p className="eyebrow">You belong here</p>
        <h2>
          Good things happen
          <br />
          when we show up
          <br />
          <span>together.</span>
        </h2>
        <p>
          Meet your neighbors, support a cause, and turn a little of your time
          into something that matters.
        </p>
        <span className="auth-story-note">Local action. Lasting impact.</span>
      </aside>
      <section className="auth-panel">
        <p className="eyebrow">The next step starts here</p>
        <h1>{signup ? "Join the community" : "Welcome back"}</h1>
        <p className="muted">
          {signup
            ? "Create an account. Make room for a little good."
            : "Log in and pick up where your impact left off."}
        </p>
        {user ? (
          <div className="account-notice">
            <p>
              You’re signed in as <strong>{user.name}</strong>.
            </p>
            <Link href={next} className="button-link">
              Continue
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit}>
            {signup && (
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  name="password"
                  aria-label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={
                    signup ? "At least 8 characters" : "Enter your password"
                  }
                  minLength={signup ? 8 : undefined}
                  maxLength={72}
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {signup && (
              <label>
                Confirm password
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password again"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </label>
            )}
            {error && <ErrorMessage message={error} />}
            <Button type="submit" className="form-submit" disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
              <ArrowRight size={17} />
            </Button>
            <p className="auth-switch">
              {signup ? "Already part of the community?" : "New to Togetherly?"}{" "}
              <Link
                className="text-link"
                href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}
              >
                {signup ? "Log in" : "Create an account"}
              </Link>
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
