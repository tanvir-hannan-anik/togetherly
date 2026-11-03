import Link from "next/link";
import { Plus } from "lucide-react";
import PersonalEvents from "@/components/PersonalEvents";
import RequireAuth from "@/components/RequireAuth";

export const metadata = { title: "My Events" };

export default function Page() {
  return <main id="main-content" className="container page"><div className="page-heading section-heading"><div><p className="eyebrow">The change you started</p><h1>My events</h1><p className="muted">A home for the causes you bring to life. Manage your events here.</p></div><Link href="/events/create" className="button-link"><Plus size={17} />Create an event</Link></div><RequireAuth><PersonalEvents /></RequireAuth></main>;
}
