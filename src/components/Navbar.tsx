"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useState } from "react";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Our Impact", href: "/impact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  function toggleTheme() {
    const nextIsDark = document.documentElement.classList.toggle("dark");
    document.documentElement.style.colorScheme = nextIsDark ? "dark" : "light";
    setIsDark(nextIsDark);
  }

  return (
    <header className="w-full bg-[#f8f7f2] font-[family-name:var(--font-geist-sans)] text-[#123c30] transition-colors dark:bg-[#132c24] dark:text-[#f8f7f2]">
      <nav
        aria-label="Main navigation"
        className="mx-auto grid min-h-[72px] max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 px-5 py-3 sm:px-12 md:grid-cols-[minmax(190px,0.9fr)_minmax(0,1.6fr)_auto] md:py-0"
      >
        <Link
          href="/"
          aria-label="Togetherly home"
          className="w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
        >
          <Image
            src="/image/Togetherly Community Leaf Logo-1.png"
            alt="Togetherly"
            width={2156}
            height={729}
            loading="eager"
            sizes="148px"
            className="h-auto w-[120px] dark:rounded-md dark:bg-[#f8f7f2] sm:w-[148px]"
          />
        </Link>

        <ul className="col-span-2 row-start-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 text-xs md:col-span-1 md:col-start-2 md:row-start-1 md:justify-start md:pt-0">
          {navigation.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className="inline-flex min-h-10 items-center rounded-sm transition-colors hover:text-[#668447] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current dark:hover:text-[#d8ed8c]"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="col-start-2 row-start-1 flex items-center gap-4 sm:gap-8 md:col-start-3 lg:gap-16">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={isDark}
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md text-[11px] transition-colors hover:text-[#668447] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current dark:hover:text-[#d8ed8c]"
          >
            {isDark ? (
              <Sun size={12} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Moon size={12} strokeWidth={1.5} aria-hidden="true" />
            )}
            {isDark ? "Light" : "Dark"}
          </button>
          <Link
            href="/login"
            className="inline-flex h-9 min-w-[76px] items-center justify-center rounded-xl bg-[#103c2f] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#205340] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#103c2f] sm:min-w-[93px] dark:bg-[#d8ed8c] dark:text-[#123c30] dark:hover:bg-[#c9df78] dark:focus-visible:outline-[#d8ed8c]"
          >
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
