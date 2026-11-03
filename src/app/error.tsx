"use client";

import { ErrorMessage } from "@/components/Feedback";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main-content" className="container page"><h1>Let’s try that again.</h1><ErrorMessage message="We couldn’t load this page. Please try again." retry={reset} /></main>;
}
