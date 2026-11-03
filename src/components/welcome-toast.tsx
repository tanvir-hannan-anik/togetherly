"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function WelcomeToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (params.get("welcome") !== "1") return;
    toast.success("Welcome to Togetherly!");
    const rest = new URLSearchParams(params);
    rest.delete("welcome");
    router.replace(rest.size ? `${pathname}?${rest}` : pathname);
  }, [params, pathname, router]);

  return null;
}
