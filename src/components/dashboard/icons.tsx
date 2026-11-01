import type { CSSProperties } from "react";
export type IconName =
  | "tracking"
  | "dispatch"
  | "safety"
  | "finance"
  | "vehicles"
  | "drivers"
  | "bell"
  | "search"
  | "chevron"
  | "plus"
  | "arrow"
  | "back"
  | "close"
  | "settings"
  | "logout"
  | "menu"
  | "locate"
  | "zoomIn"
  | "zoomOut"
  | "layers"
  | "check"
  | "checkAll"
  | "signal"
  | "download"
  | "pause"
  | "play"
  | "filter"
  | "fuel"
  | "brake"
  | "speed"
  | "clock"
  | "route"
  | "phone"
  | "refresh";
const paths: Record<IconName, React.ReactNode> = {
  tracking: (
    <>
      <path d="M8 3H4v4M16 3h4v4M4 17v4h4M20 17v4h-4" />
      <path d="m12 6 4 11-4-2-4 2 4-11Z" />
    </>
  ),
  dispatch: (
    <>
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M7 5h7a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h6M18 3l2 2-2 2" />
    </>
  ),
  safety: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z" />
      <path d="M7 12h3l2-4 2 8 2-4h2" />
    </>
  ),
  finance: (
    <>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M8 9h8M8 13h3M8 17h3M15 13h1M15 17h1M8 2v4M16 2v4" />
    </>
  ),
  vehicles: (
    <>
      <path d="M3 7h11v11H3zM14 11h4l3 4v3h-7M3 11h7" />
      <circle cx="7" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
    </>
  ),
  drivers: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4h5M17 8h4M18 12h3M18 16h3" />
    </>
  ),
  bell: (
    <>
      <path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3Z M10 20h4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
  back: <path d="m15 18-6-6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  settings: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="8" cy="7" r="3" />
      <circle cx="16" cy="17" r="3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 3H4v18h6M10 12h11m-4-4 4 4-4 4" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </>
  ),
  layers: (
    <>
      <path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  checkAll: (
    <>
      <path d="m3 12 4 4L17 6M8 12l4 4 8-8" />
    </>
  ),
  signal: (
    <>
      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V4" />
    </>
  ),
  download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="m8 4 12 8-12 8V4Z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  fuel: (
    <>
      <path d="M4 21V4h9v17M3 21h12M4 11h9M17 5l3 3v10a2 2 0 0 1-4 0v-6h-3" />
    </>
  ),
  brake: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M5 4a11 11 0 0 0 0 16M19 4a11 11 0 0 1 0 16M12 9v4m0 2v.1" />
    </>
  ),
  speed: (
    <>
      <path d="M4 18a9 9 0 1 1 16 0M12 12l5-5M7 18h10" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M6 7v8a4 4 0 0 0 4 4h6M10 5h8v8" />
    </>
  ),
  phone: (
    <path d="m5 3 4 1 1 5-3 2a14 14 0 0 0 6 6l2-3 5 1 1 4c-8 6-23-9-16-16Z" />
  ),
  refresh: (
    <>
      <path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6" />
    </>
  ),
};
export function Icon({
  name,
  className,
  style,
}: {
  name: IconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
