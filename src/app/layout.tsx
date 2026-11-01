import "maplibre-gl/dist/maplibre-gl.css";
import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
export const metadata: Metadata = {
  title: "FLEETRA Fleet Operations",
  description:
    "Pusat kendali armada FLEETRA. Pelacakan, penugasan, keselamatan, dan ekuitas dalam satu workspace.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <a href="#main-content" className="skip-link">
          Lewati ke konten
        </a>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
