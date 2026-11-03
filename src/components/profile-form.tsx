"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ErrorMessage, Loading } from "@/components/Feedback";

export default function ProfileForm() {
  const { data: session, isPending } = authClient.useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (isPending) return <Loading label="Loading your profile…" />;
  if (!session)
    return <ErrorMessage message="Please log in to view your profile." />;
  const { user } = session;

  async function handleSubmit(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    setError("");
    const fields = new FormData(submission.currentTarget);
    const name = String(fields.get("name")).trim();
    const image = String(fields.get("image")).trim();
    if (name.length < 2)
      return setError("Your name must have at least 2 characters.");
    if (image && !/^https?:\/\/\S+$/i.test(image))
      return setError("Enter a valid http or https image URL.");
    setBusy(true);
    const { error } = await authClient.updateUser({
      name,
      image: image || null,
    });
    setBusy(false);
    if (error)
      return setError(error.message || "Your profile could not be updated.");
    toast.success("Your profile has been updated.");
  }

  return (
    <div className="form-layout">
      <form className="form-stack form-panel" onSubmit={handleSubmit}>
        <div className="organizer-panel">
          <span className="user-avatar">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              (user.name || user.email).charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <h3>{user.name}</h3>
            <p className="muted">{user.email}</p>
          </div>
        </div>
        <label>
          Display name *
          <input
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={80}
            required
          />
        </label>
        <label>
          Photo URL
          <input
            name="image"
            type="url"
            defaultValue={user.image || ""}
            maxLength={2000}
            placeholder="https://example.com/your-photo.jpg"
          />
        </label>
        {error && <ErrorMessage message={error} />}
        <Button type="submit" className="form-submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </div>
  );
}
