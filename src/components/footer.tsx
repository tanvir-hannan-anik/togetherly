import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link href="/" aria-label="Togetherly home">
            <Image
              src="/image/Togetherly Community Leaf Logo-1.png"
              alt="Togetherly"
              width={148}
              height={50}
              className="footer-logo"
            />
          </Link>
          <p>
            Small actions. Stronger communities.
            <br />
            Let’s make a difference, together.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <h2>Get involved</h2>
          <Link href="/events">Explore events</Link>
          <Link href="/events/create">Create an event</Link>
          <Link href="/impact">Our impact</Link>
          <Link href="/joined-events">Joined events</Link>
        </nav>
        <div>
          <h2>Follow the good</h2>
          <p>Stories and new causes from our community.</p>
          <ul className="social-links">
            <li>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Togetherly on X"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Togetherly on Facebook"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Togetherly on Instagram"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </li>
          </ul>
          <p>hello@togetherly.org</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Togetherly · Made for a kinder world.</span>
        <span>Local action. Lasting impact.</span>
      </div>
    </footer>
  );
}
