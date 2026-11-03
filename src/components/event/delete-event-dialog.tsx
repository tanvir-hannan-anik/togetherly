"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";

export default function DeleteEventButton({
  id,
  title,
  onDeleted,
}: {
  id: string;
  title: string;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (
      !window.confirm(
        `Delete “${title}”? This will also remove all volunteer signups. This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/events/${id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="destructive" disabled={busy} onClick={remove}>
        <Trash2 size={15} />
        {busy ? "Deleting…" : "Delete event"}
      </Button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
