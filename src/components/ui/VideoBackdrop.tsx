"use client";

import { useEffect, useRef, useState } from 'react';

/**
 * Ambient background video, used by the landing hero and the auth screens.
 *
 * A still image is always rendered underneath by the caller — that is the real
 * first paint. This mounts only after hydration and fades in once the browser
 * can actually play, so the video never competes with LCP and a failure to load
 * is invisible.
 *
 * It plays on every screen size, including phones. It is skipped only when the
 * visitor has opted out in a way we should honour:
 *   • `prefers-reduced-motion: reduce` — a looping backdrop is exactly what
 *     that setting is about, or
 *   • the browser reports Save-Data or a 2G-class connection.
 *
 * NOTE: the source file is ~15 MB. That is heavy for phones on cellular data;
 * re-encoding it smaller is the real fix.
 */

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

const shouldPlayVideo = () => {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^|\b)(slow-)?2g$/.test(connection.effectiveType)) return false;

  return true;
};

export function VideoBackdrop({ src, className = '' }: { src: string; className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setEnabled(shouldPlayVideo());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const video = videoRef.current;
    if (!video) return;

    const reveal = () => setVisible(true);
    // `canplay` may already have fired by the time this runs.
    if (video.readyState >= 3) reveal();
    video.addEventListener('canplay', reveal);

    // Autoplay can still be refused; the still image below stays visible if so.
    void video.play().catch(() => undefined);

    return () => video.removeEventListener('canplay', reveal);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <video
      ref={videoRef}
      aria-hidden
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      className={`pointer-events-none object-cover transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
