import Link from "next/link";
import { EmptyState } from "@/components/Feedback";

export default function NotFound() {
  return (
    <main id="main-content" className="container page">
      <EmptyState title="This path doesn’t lead to an event">
        <p>
          The page may have moved. There’s still plenty of good to discover.
        </p>
        <Link href="/events" className="button-link">
          Explore events
        </Link>
      </EmptyState>
    </main>
  );
}
