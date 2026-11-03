"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Upcoming Events", href: "/events" },
  { label: "Our Impact", href: "/impact" },
];

const profileLinks = [
  { label: "Create Event", href: "/events/create" },
  { label: "Manage Events", href: "/my-events" },
  { label: "Joined Events", href: "/joined-events" },
  { label: "My Profile", href: "/profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const displayName = user?.name || user?.email || "";
  const [isDark, setIsDark] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    const { error } = await authClient.signOut();
    if (error)
      return toast.error(error.message || "Logout failed. Please try again.");
    toast.success("You have been logged out.");
    router.push("/");
    router.refresh();
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
              <div
                className="profile-menu"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setMenuOpen(false);
                }}
              >
                <button
                  className="avatar-button"
                  title={displayName}
                  aria-label={`Account menu for ${displayName}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                  <span className="avatar-name" aria-hidden="true">
                    {displayName}
                  </span>
                </button>
                {menuOpen && (
                  <div className="profile-dropdown" role="menu">
                    <p className="profile-dropdown-name">{displayName}</p>
                    {profileLinks.map(({ label, href }) => (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="icon-button"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link href="/login" className="button-link small">
              {isPending ? "Account" : "Login"}
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
    </header>
  );
}
