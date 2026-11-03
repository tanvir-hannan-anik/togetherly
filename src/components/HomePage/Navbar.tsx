"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { errorMessage } from "@/lib/api";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Our Impact", href: "/impact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dark = localStorage.getItem("togetherly-theme") === "dark";
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  function toggleTheme() {
    const dark = !isDark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("togetherly-theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  async function handleLogout() {
    setBusy(true);
    setError("");
    try {
      await logout();
      setOpen(false);
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="site-header">
      <nav className="container nav-bar" aria-label="Main navigation">
        <Link
          href="/"
          aria-label="Togetherly home"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/image/Togetherly Community Leaf Logo-1.png"
            alt="Togetherly"
            width={148}
            height={50}
            preload
            className="brand-logo"
          />
        </Link>
        <div
          id="main-navigation"
          className={`nav-links ${open ? "is-open" : ""}`}
        >
          {navigation.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user && (
            <>
              <Link
                href="/my-events"
                onClick={() => setOpen(false)}
                aria-current={pathname === "/my-events" ? "page" : undefined}
              >
                My events
              </Link>
              <Link
                href="/joined-events"
                onClick={() => setOpen(false)}
                aria-current={
                  pathname === "/joined-events" ? "page" : undefined
                }
              >
                Joined events
              </Link>
            </>
          )}
        </div>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
          {user ? (
            <>
              <span
                className="user-avatar"
                title={user.name}
                aria-label={`Signed in as ${user.name}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              <button
                className="icon-button"
                disabled={busy}
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login" className="button-link small">
              {loading ? "Account" : "Login"}
            </Link>
          )}
          <button
            className="mobile-menu icon-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {error && (
        <p className="container error-text" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
