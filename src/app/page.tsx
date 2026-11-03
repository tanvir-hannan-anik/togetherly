import Header from "@/components/home/banner";
import Info from "@/components/home/featured";
import UpcomingEvents from "@/components/home/upcoming-events";
import Gallery from "@/components/home/gallery";
import Newsletter from "@/components/home/newsletter";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main id="main-content" className="home-page">
      <Header />
      <Info />
      <UpcomingEvents />
      <Gallery />
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
      <Newsletter />
    </main>
  );
}
