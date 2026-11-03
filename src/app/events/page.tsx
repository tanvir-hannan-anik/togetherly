import EventBrowser from "@/components/EventBrowser";

export const metadata = { title: "Upcoming Events" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <div className="page-heading">
        <p className="eyebrow">A little time. A lasting difference.</p>
        <h1>Find your next good thing.</h1>
        <p className="muted">
          Discover upcoming events and make a difference in your community.
        </p>
      </div>
      <EventBrowser />
    </main>
  );
}
