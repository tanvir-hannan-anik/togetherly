import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

export default function Header() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto grid w-full max-w-7xl items-center gap-8 overflow-hidden rounded-[20px] bg-[#103c2f] px-7 py-8 font-[family-name:var(--font-geist-sans)] md:min-h-[342px] md:grid-cols-[1.5fr_1fr] md:gap-12 md:pr-[54px] lg:px-12 lg:py-12"
    >
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.015em] text-[#e1f28b] lg:text-[11px]">
          Local action. Lasting impact.
        </p>
        <h1
          id="hero-heading"
          className="mt-8 text-[34px] font-bold leading-[1.18] tracking-[-0.04em] text-white sm:text-[40px] lg:text-5xl"
        >
          Better communities
          <span className="block text-[#e1f28b]">start with us.</span>
        </h1>
        <p className="mt-5 max-w-[390px] text-[13px] leading-[1.35] text-[#c4d5ce] lg:max-w-[440px] lg:text-sm">
          Discover meaningful events nearby. Show up, make friends, and create
          real change—one act of kindness at a time.
        </p>
        <div className="mt-10 flex flex-wrap gap-2.5">
          <Link
            href="/events"
            className="inline-flex min-h-[38px] min-w-[126px] items-center justify-center gap-1 rounded-[9px] bg-[#e1f28b] px-3 text-[10px] font-semibold text-[#123c30] transition-colors hover:bg-[#d0e577] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e1f28b] lg:min-h-11 lg:px-5 lg:text-xs"
          >
            Explore events
            <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
          <Link
            href="/events/create"
            className="inline-flex min-h-[38px] min-w-[126px] items-center justify-center gap-1 rounded-[9px] bg-[#315b4c] px-3 text-[10px] font-semibold text-white transition-colors hover:bg-[#416e5d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e1f28b] lg:min-h-11 lg:px-5 lg:text-xs"
          >
            Start a cause
            <Plus size={11} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <div className="relative aspect-square w-full max-w-[400px] justify-self-center overflow-hidden rounded-[18px] md:justify-self-end">
        <Image
          src="/image/heroimage.png"
          alt="Community volunteers planting a young tree together in a park"
          fill
          preload
          sizes="(max-width: 767px) min(400px, calc(100vw - 96px)), (max-width: 1279px) 33vw, 400px"
          className="object-cover"
        />
      </div>
    </section>
  );
}
