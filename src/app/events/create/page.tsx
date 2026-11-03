import EventForm from "@/components/EventForm";

export const metadata = { title: "Create an Event" };

export default function Page() {
  return (
    <main id="main-content" className="container page">
      <div className="page-heading">
        <p className="eyebrow">Organize a positive change</p>
        <h1>Create a community event</h1>
        <p className="muted">
          Bring people together for a cause that matters. Fields marked * are
          required.
        </p>
      </div>
        <EventForm />
    </main>
  );
}
