import Header from "@/components/HomePage/Header";
import Info from "@/components/HomePage/Info";
import UpcomingEvents from "@/components/HomePage/UpcomingEvents";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main id="main-content" className="home-page">
      <Header />
      <Info />
      <UpcomingEvents />
      <section className="container community-cta">
        <div>
          <p className="eyebrow">Small steps. Real change.</p>
          <h2>Have a cause close to your heart?</h2>
          <p>Bring your neighbors together. Start something meaningful.</p>
        </div>
        <Link href="/events/create" className="button-link lime">
          Start a cause
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </main>
  );
}
