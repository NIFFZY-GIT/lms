"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseBannerProps = {
  slot: string;
  className?: string;
};

/**
 * AdSense slot that takes up no space unless an ad actually renders.
 *
 * AdSense stamps `data-ad-status="filled" | "unfilled"` on the <ins> once it
 * resolves. Without watching that, the decorative wrapper (border, white
 * background, padding) stays visible as an empty box whenever nothing is
 * served — on localhost, before the site is approved, or when a request simply
 * goes unfilled. The frame is therefore only applied once the ad is filled.
 */
export function AdSenseBanner({ slot, className = "" }: AdSenseBannerProps) {
  const insRef = useRef<HTMLModElement>(null);
  const [status, setStatus] = useState<"pending" | "filled" | "unfilled">("pending");

  useEffect(() => {
    if (!slot) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore duplicate/early init errors from ad script timing.
    }
  }, [slot]);

  useEffect(() => {
    const el = insRef.current;
    if (!slot || !el) return;

    const read = () => {
      const value = el.getAttribute("data-ad-status");
      if (value === "filled" || value === "unfilled") setStatus(value);
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [slot]);

  if (!slot || status === "unfilled") return null;

  return (
    // While pending, the wrapper stays unstyled so nothing shows until an ad lands.
    <div className={status === "filled" ? className : undefined}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4147783548079095"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
