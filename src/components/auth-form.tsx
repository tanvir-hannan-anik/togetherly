"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/feedback";

export function passwordProblem(password: string) {
  if (password.length < 6)
    return "Password must be at least 6 characters long.";
  if (!/[A-Z]/.test(password))
    return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must include a lowercase letter.";
  return "";
}

function safeNext(value: string | null) {
  return value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/events";
}

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    setError("");
    const fields = new FormData(submission.currentTarget);
    const email = String(fields.get("email")).trim();
    const password = String(fields.get("password"));

    if (signup) {
      const problem = passwordProblem(password);
      if (problem) return fail(problem);
    }

    setBusy(true);
    const { error } = signup
      ? await authClient.signUp.email({
          name: String(fields.get("name")).trim(),
          email,
          password,
          image: String(fields.get("photoURL")).trim() || undefined,
        })
      : await authClient.signIn.email({ email, password });
    setBusy(false);

    if (error)
      return fail(error.message || "Something went wrong. Please try again.");
    toast.success(signup ? "Welcome to Togetherly!" : "Welcome back!");
    router.replace(next);
    router.refresh();
  }

  async function signInWithGitHub() {
    setError("");
    const joiner = next.includes("?") ? "&" : "?";
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: `${next}${joiner}welcome=1`,
    });
    if (error)
      fail(error.message || "GitHub sign-in failed. Please try again.");
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
          {signup && (
            <label>
              Photo URL
              <input
                name="photoURL"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                maxLength={2000}
              />
            </label>
          )}
          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                aria-label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={
                  signup
                    ? "6+ characters, upper & lower case"
                    : "Enter your password"
                }
                maxLength={128}
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
          {error && <ErrorMessage message={error} />}
          <Button type="submit" className="form-submit" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
            <ArrowRight size={17} />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="form-submit"
            onClick={signInWithGitHub}
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
            </svg>
            Continue with GitHub
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
      </section>
    </div>
  );
}
