"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

export default function EventImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) return <div className={`image-fallback ${className}`}><ImageOff size={30} /><span>Event image unavailable</span></div>;
  // Organizer-supplied images are loaded directly, without proxying arbitrary URLs through Next.js.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedSource(src)} />;
}
