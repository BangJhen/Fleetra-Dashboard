"use client";
import { useId } from "react";
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}
export interface ChartPoint {
  at: string;
  [key: string]: number | string;
}
const shortDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  });
export function BarChart({
  title,
  description,
  items,
  unit = "unit",
  compact = false,
}: {
  title: string;
  description: string;
  items: { label: string; value: number }[];
  unit?: string;
  compact?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="content-panel safety-chart">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div
        className="safety-bars"
        role="img"
        aria-label={`${title}. ${items.map((i) => `${i.label} ${i.value} ${unit}`).join(". ")}`}
      >
        {items.map((item, i) => (
          <div className="safety-bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="safety-bar-track">
              <i
                style={{
                  width: `${(item.value / max) * 100}%`,
                  background: ["#2463D8", "#537FC6", "#819BC4", "#B2C4DF"][
                    i % 4
                  ],
                }}
              />
            </div>
            <strong>
              {item.value}
              <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>
      {!compact && <div className="safety-chart-caption">
        Skala perbandingan 0 sampai {max} {unit}
      </div>}
    </section>
  );
}
export function TrendChart({
  title,
  description,
  points,
  series,
}: {
  title: string;
  description: string;
  points: ChartPoint[];
  series: ChartSeries[];
}) {
  const id = useId();
  const width = 640,
    height = 220,
    left = 42,
    right = 18,
    top = 20,
    bottom = 36;
  const axisLabel = (at: string) =>
    points.length > 1 &&
    shortDate(points[0].at) === shortDate(points[points.length - 1].at)
      ? new Date(at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        })
      : shortDate(at);
  const times = points.map((p) => Date.parse(p.at));
  const first = Math.min(...times),
    last = Math.max(...times);
  const x = (i: number) =>
    points.length === 1
      ? width / 2
      : left +
        ((times[i] - first) / Math.max(1, last - first)) *
          (width - left - right);
  const y = (v: number) => top + ((100 - v) / 100) * (height - top - bottom);
  return (
    <section className="content-panel safety-chart">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {points.length === 0 ? (
        <div className="safety-chart-empty">
          Belum ada catatan pada rentang waktu ini
        </div>
      ) : (
        <div className="safety-trend">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-labelledby={id}
          >
            <title
              id={id}
            >{`${title}. ${points.length} catatan dengan skala 0 sampai 100`}</title>
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="#E2E8F0"
                />
                <text
                  x={left - 10}
                  y={y(v) + 4}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="10"
                >
                  {v}
                </text>
              </g>
            ))}
            {series.map((s) => (
              <g key={s.key}>
                <polyline
                  points={points
                    .map((p, i) => `${x(i)},${y(Number(p[s.key]))}`)
                    .join(" ")}
                  stroke={s.color}
                  strokeWidth="2.5"
                  fill="none"
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={x(i)}
                    cy={y(Number(p[s.key]))}
                    r={points.length === 1 ? 4 : 3}
                    fill={s.color}
                    tabIndex={0}
                    role="img"
                    aria-label={`${shortDate(p.at)} ${s.label} ${p[s.key]}`}
                  >
                    <title>{`${new Date(p.at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} ${s.label} ${p[s.key]}`}</title>
                  </circle>
                ))}
              </g>
            ))}
            <text x={left} y={height - 10} fill="#64748B" fontSize="10">
              {axisLabel(points[0].at)}
            </text>
            {points.length > 1 && (
              <text
                x={width - right}
                y={height - 10}
                textAnchor="end"
                fill="#64748B"
                fontSize="10"
              >
                {axisLabel(points[points.length - 1].at)}
              </text>
            )}
          </svg>
          <div className="safety-chart-legend">
            {series.map((s) => (
              <span key={s.key} style={{ color: s.color }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="safety-chart-caption">
        {points.length < 2
          ? "Tren akan terbentuk setelah tersedia minimal dua catatan. Tidak ada histori tanggal lampau yang direkayasa."
          : "Titik menunjukkan catatan tersimpan. Arahkan kursor atau fokuskan titik untuk melihat nilainya."}
      </div>
    </section>
  );
}
