"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, ErrorMessage, Loading } from "@/components/Feedback";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  const pathname = usePathname();
  if (loading) return <Loading label="Checking your account…" />;
  if (error) return <ErrorMessage message={error} retry={refresh} />;
  if (!user) return <EmptyState title="A little good starts with you"><p>Log in to organize events and join your community.</p><Link className="button-link" href={`/login?next=${encodeURIComponent(pathname)}`}>Log in to continue</Link></EmptyState>;
  return <>{children}</>;
}
