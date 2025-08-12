'use client';

import React, { useRef, useEffect } from 'react';

type SecureVideoProps = {
  src: string;
  type?: string;
  poster?: string;
  className?: string;
  watermark?: string; // e.g., user email or name
};

// Best-effort protections: disable download/PiP/remote playback, block context menu/drag, and overlay a watermark.
export function SecureVideo({ src, type = 'video/mp4', poster, className = '', watermark }: SecureVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
  const v = videoRef.current;
    if (!v) return;
    try {
      // Reinforce controlsList at runtime (some browsers honor dynamic changes)
      v.setAttribute('controlsList', 'nodownload noplaybackrate');
      // Non-standard props on some browsers
      const ns = v as unknown as { disablePictureInPicture?: boolean; disableRemotePlayback?: boolean };
      ns.disablePictureInPicture = true;
      ns.disableRemotePlayback = true;
    } catch {}

    const prevent = (e: Event) => e.preventDefault();
    v.addEventListener('contextmenu', prevent);
    v.addEventListener('dragstart', prevent);
  v.addEventListener('copy', prevent as EventListener);
  v.addEventListener('cut', prevent as EventListener);
  v.addEventListener('paste', prevent as EventListener);

    const onDocKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const combo = e.ctrlKey || e.metaKey;
      if (
        combo && ['s', 'p', 'u', 'i', 'j', 'c'].includes(key) // save/print/view-source/devtools/copy
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (key === 'f12') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', onDocKey, { capture: true });
    return () => {
      v.removeEventListener('contextmenu', prevent);
      v.removeEventListener('dragstart', prevent);
  v.removeEventListener('copy', prevent as EventListener);
  v.removeEventListener('cut', prevent as EventListener);
  v.removeEventListener('paste', prevent as EventListener);
  document.removeEventListener('keydown', onDocKey, { capture: true });
    };
  }, []);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // Block common save/devtools/print shortcuts (best-effort, not bulletproof)
    if (
      (e.ctrlKey || e.metaKey) &&
      ['s', 'p', 'u', 'i', 'j'].includes(e.key.toLowerCase())
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className={`relative select-none ${className}`} onKeyDown={onKeyDown} tabIndex={-1} style={{ userSelect: 'none' }}>
      {/* Video element with protective attributes */}
      <video
        ref={videoRef}
        controls
        // Disable PiP and remote playback on supporting browsers
        disablePictureInPicture
        disableRemotePlayback
        // Hint to block certain controls
        controlsList="nodownload noplaybackrate"
        playsInline
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => e.preventDefault()} // avoid toggling fullscreen on dblclick
        onKeyDown={(e) => {
          // Block some single-key shortcuts when the video element is focused
          if (['f', 'p', 'k'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        poster={poster}
        className="w-full rounded-lg aspect-video bg-black"
      >
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>

      {/* Watermark overlay (non-interactive) */}
      {watermark && (
        <>
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {Array.from({ length: 10 }).map((_, idx) => (
              <span
                key={idx}
                className="wm absolute text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-blue-600/15"
                style={{
                  left: `${(idx * 10) % 90}%`,
                  top: `${(idx * 7) % 80}%`,
                }}
              >
                {watermark}
              </span>
            ))}
          </div>
          <style>{`
            @keyframes wm-move {
              0% { transform: translate(0, 0) rotate(-15deg); }
              50% { transform: translate(20px, 10px) rotate(-15deg); }
              100% { transform: translate(0, 0) rotate(-15deg); }
            }
            .wm { animation: wm-move 12s ease-in-out infinite; white-space: nowrap; }
          `}</style>
        </>
      )}
    </div>
  );
}

export default SecureVideo;
