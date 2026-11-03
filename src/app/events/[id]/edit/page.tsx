import EventEditor from "@/components/EventEditor";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "Edit Event" };

export default function Page() {
  return <main id="main-content" className="container page"><div className="page-heading"><p className="eyebrow">Keep your community in the loop</p><h1>Edit your event</h1><p className="muted">Update the details so everyone knows what to expect.</p></div><RequireAuth><EventEditor /></RequireAuth></main>;
}
