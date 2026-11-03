"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Icon } from "./icons";

interface LoginHero3DProps {
  registering: boolean;
}

export function LoginHero3D({ registering }: LoginHero3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Normalized from -1 to 1
    const normX = Math.max(-1, Math.min(1, (x - 0.5) * 2));
    const normY = Math.max(-1, Math.min(1, (y - 0.5) * 2));

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setCoords({ x: normX, y: normY });
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setCoords({ x: 0, y: 0 });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // 3D Tilt calculation:
  // Tilting up/down rotates around X axis (driven by Y cursor)
  // Tilting left/right rotates around Y axis (driven by X cursor)
  const maxTilt = 9; // degrees
  const rotateX = isHovered ? -coords.y * maxTilt : 0;
  const rotateY = isHovered ? coords.x * maxTilt : 0;

  // Parallax offsets for floating badges
  const badge1X = coords.x * 12;
  const badge1Y = coords.y * 12;
  const badge2X = -coords.x * 10;
  const badge2Y = -coords.y * 10;
  const badge3X = coords.x * 8;
  const badge3Y = coords.y * 8;

  // Glare position in percent
  const glareX = ((coords.x + 1) / 2) * 100;
  const glareY = ((coords.y + 1) / 2) * 100;

  return (
    <div className="login-intro-perspective">
      <div
        ref={cardRef}
        className={`login-intro hero-3d-card ${isHovered ? "is-tilting" : "is-ambient"}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={
          {
            "--tilt-x": `${rotateX.toFixed(2)}deg`,
            "--tilt-y": `${rotateY.toFixed(2)}deg`,
            "--glare-x": `${glareX.toFixed(1)}%`,
            "--glare-y": `${glareY.toFixed(1)}%`,
            "--glare-opacity": isHovered ? 0.45 : 0,
          } as React.CSSProperties
        }
      >
        {/* Animated laser beam on the top border */}
        <div className="card-top-beam" aria-hidden="true" />

        {/* Dynamic specular light reflection sheen */}
        <div className="card-glare" aria-hidden="true" />

        {/* Floating 3D Badge 1: Top-Right Live Telemetry (dots removed) */}
        <div
          className="telemetry-badge telemetry-badge-top"
          style={{
            transform: `translate3d(${badge1X}px, ${badge1Y}px, 60px)`,
          }}
        >
          <div className="badge-info">
            <span className="badge-title">142 Armada Aktif</span>
            <span className="badge-sub">GPS 99.8% Sinyal Kuat</span>
          </div>
        </div>

        {/* Header kicker with 3D layer (dots removed) */}
        <div className="login-intro-header">
          <div className="login-kicker-badge">
            <span>
              {registering
                ? "Workspace untuk tim operasional"
                : "Kendali yang lebih terarah"}
            </span>
          </div>

          <h1>
            {registering ? (
              <>
                Mulai bersama.
                <br /> Bergerak terarah.
              </>
            ) : (
              <>
                Seluruh armada.
                <br /> Satu pandangan.
              </>
            )}
          </h1>
          <p>
            Dari penugasan pertama hingga pengantaran terakhir. Kelola
            perjalanan, keselamatan, dan pertumbuhan mitra dari satu pusat
            kendali.
          </p>
        </div>

        {/* Central Vehicle Illustration & 3D Stage */}
        <div className="auth-illustration-stage">
          {/* Central Vehicle Illustration (using user's screenshot) */}
          <div className="auth-illustration">
            <Image
              src="/images/fleetra-auth-illustration.png"
              alt="Ilustrasi armada pengiriman FLEETRA di kawasan gudang dan perkotaan"
              width={1024}
              height={506}
              sizes="(max-width: 560px) 350px, (max-width: 900px) 520px, 560px"
              priority
              unoptimized
            />
          </div>

          {/* Floating 3D Badge 2: Bottom-Left Route Telemetry */}
          <div
            className="telemetry-badge telemetry-badge-bottom"
            style={{
              transform: `translate3d(${badge2X}px, ${badge2Y}px, 68px)`,
            }}
          >
            <div className="badge-icon-box">
              <Icon name="route" />
            </div>
            <div className="badge-info">
              <span className="badge-title">Rute Teroptimasi</span>
              <span className="badge-sub">99.4% On-Time Delivery</span>
            </div>
          </div>

          {/* Floating 3D Badge 3: Mid-Right Safety Score */}
          <div
            className="telemetry-badge telemetry-badge-mid"
            style={{
              transform: `translate3d(${badge3X}px, ${badge3Y}px, 52px)`,
            }}
          >
            <div className="badge-icon-box badge-icon-safety">
              <Icon name="safety" />
            </div>
            <div className="badge-info">
              <span className="badge-title">Safety Score 98.4</span>
              <span className="badge-sub">Status: Prima</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
