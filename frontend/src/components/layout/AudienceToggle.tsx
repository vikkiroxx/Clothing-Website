"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Audience = "men" | "women" | "kids";

const STORAGE_KEY = "audience-toggle";
const SLOT_WIDTH = 28;
const KNOB_SIZE = 16;
const TRACK_WIDTH = SLOT_WIDTH * 3;

function ManIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-black/70" fill="none">
      <circle cx="8" cy="3.2" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 5v5.5M4.5 7.5h7M8 10.5 5 14.5M8 10.5l3 4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WomanIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-black/70" fill="none">
      <circle cx="8" cy="3.2" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 5v3.5M5 7.2h6M5.5 14.5 8 8.5l2.5 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KidIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-black/70" fill="none">
      <circle cx="8" cy="4" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 6.3v3M5.5 7.8h5M8 9.3 6 12.5M8 9.3l2 3.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STOPS: {
  key: Audience;
  label: string;
  href: string;
  knobClass: string;
  textClass: string;
  Icon: () => React.JSX.Element;
}[] = [
  {
    key: "men",
    label: "Men's Wear",
    href: "/men",
    knobClass: "bg-sky-400",
    textClass: "text-sky-400",
    Icon: ManIcon,
  },
  {
    key: "women",
    label: "Women's Wear",
    href: "/women",
    knobClass: "bg-pink-400",
    textClass: "text-pink-400",
    Icon: WomanIcon,
  },
  {
    key: "kids",
    label: "Kids' Wear",
    href: "/kids",
    knobClass: "bg-amber-200",
    textClass: "text-amber-200",
    Icon: KidIcon,
  },
];

export function AudienceToggle() {
  const pathname = usePathname();
  // "/" renders the same content as "/men" (the default landing audience).
  const pathMatch = pathname === "/" ? "men" : STOPS.find((s) => s.href === pathname)?.key;

  const [preference, setPreference] = useState<Audience>("men");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && STOPS.some((s) => s.key === stored)) {
        // Read-after-mount is intentional here: the server always renders
        // the "men" default (it has no access to this browser's storage),
        // so the real persisted value can only be applied once mounted.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreference(stored as Audience);
      }
    } catch {
      // localStorage unavailable (private browsing, blocked, etc.) — ignore.
    }
  }, []);

  // On /men, /women, /kids the URL is the source of truth; elsewhere (e.g.
  // the homepage) fall back to the last remembered preference.
  const audience = pathMatch ?? preference;

  function remember(next: Audience) {
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const index = STOPS.findIndex((s) => s.key === audience);
  const current = STOPS[index]!;
  const Icon = current.Icon;

  return (
    <div className="flex flex-col items-center gap-1">
      <nav aria-label="Shop for" className="relative h-5" style={{ width: TRACK_WIDTH }}>
        {/* Straight track line, inset to span between the first and last stop centers. */}
        <div
          aria-hidden
          className="absolute top-1/2 h-px -translate-y-1/2 bg-border-strong"
          style={{ left: SLOT_WIDTH / 2, right: SLOT_WIDTH / 2 }}
        />

        {/* Tick marks at each stop, showing where to click. */}
        {STOPS.map((stop, i) => (
          <div
            key={stop.key}
            aria-hidden
            className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-strong"
            style={{ left: i * SLOT_WIDTH + SLOT_WIDTH / 2 }}
          />
        ))}

        {STOPS.map((stop, i) => (
          <Link
            key={stop.key}
            href={stop.href}
            aria-label={stop.label}
            aria-current={stop.key === audience ? "page" : undefined}
            onClick={() => remember(stop.key)}
            className="absolute top-1/2 z-10 h-6 -translate-y-1/2"
            style={{
              left: i * SLOT_WIDTH,
              width: SLOT_WIDTH,
            }}
          />
        ))}

        <div
          aria-hidden
          className={`absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full transition-[left] duration-200 ease-out ${current.knobClass}`}
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            left: index * SLOT_WIDTH + SLOT_WIDTH / 2 - KNOB_SIZE / 2,
          }}
        >
          <Icon />
        </div>
      </nav>

      <span
        className={`font-mono text-[10px] tracking-widest uppercase ${current.textClass}`}
      >
        {current.label}
      </span>
    </div>
  );
}
