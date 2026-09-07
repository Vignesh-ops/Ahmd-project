"use client";

import { useMemo, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 16;
const PAD_BOTTOM = 26;

const COLORS = {
  dark: { idr: "#BF8A28", inr: "#159E86" },
  light: { idr: "#D4A843", inr: "#1ECFB0" }
};

const INK = {
  dark: {
    axisText: "rgba(255, 255, 255, 0.4)",
    gridline: "rgba(255, 255, 255, 0.1)",
    crosshair: "rgba(255, 255, 255, 0.25)",
    dotRing: "#111318"
  },
  light: {
    axisText: "rgba(71, 85, 105, 0.84)",
    gridline: "rgba(15, 23, 42, 0.08)",
    crosshair: "rgba(15, 23, 42, 0.18)",
    dotRing: "#ffffff"
  }
};

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DAY_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function roundUpNice(value) {
  if (value <= 4) {
    return 4;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return niceNormalized * magnitude;
}

function parseDayKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function OrderTrendChart({ data = [] }) {
  const { theme } = useTheme();
  const palette = theme === "light" ? COLORS.light : COLORS.dark;
  const ink = theme === "light" ? INK.light : INK.dark;
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const hasData = data.length > 0;
  const totalOrders = useMemo(() => data.reduce((sum, day) => sum + day.idr + day.inr, 0), [data]);

  const chart = useMemo(() => {
    if (!hasData) {
      return null;
    }

    const maxValue = roundUpNice(Math.max(1, ...data.map((day) => Math.max(day.idr, day.inr))));
    const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
    const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

    const xFor = (index) => PAD_LEFT + stepX * index;
    const yFor = (value) => PAD_TOP + plotHeight - (value / maxValue) * plotHeight;

    const buildLine = (key) =>
      data.map((day, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(2)},${yFor(day[key]).toFixed(2)}`).join(" ");

    const buildArea = (key) => {
      const line = buildLine(key);
      const lastX = xFor(data.length - 1);
      const firstX = xFor(0);
      const baseline = PAD_TOP + plotHeight;
      return `${line} L${lastX.toFixed(2)},${baseline.toFixed(2)} L${firstX.toFixed(2)},${baseline.toFixed(2)} Z`;
    };

    const yTicks = [0, Math.round(maxValue / 2), maxValue];

    // Show at most ~5 x-axis labels so they never crowd on a narrow phone screen.
    const labelEvery = Math.max(1, Math.ceil(data.length / 5));
    const xLabels = data
      .map((day, index) => ({ index, day }))
      .filter(({ index }) => index === 0 || index === data.length - 1 || index % labelEvery === 0);

    return {
      maxValue,
      plotWidth,
      plotHeight,
      stepX,
      xFor,
      yFor,
      idrLine: buildLine("idr"),
      inrLine: buildLine("inr"),
      idrArea: buildArea("idr"),
      inrArea: buildArea("inr"),
      yTicks,
      xLabels
    };
  }, [data, hasData]);

  function handlePointerMove(event) {
    if (!chart || !containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const index = Math.round((relativeX - PAD_LEFT) / (chart.stepX || 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  function handlePointerLeave() {
    setHoverIndex(null);
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;
  const hoverX = hoverIndex !== null && chart ? chart.xFor(hoverIndex) : null;
  const tooltipOnRight = hoverX !== null && hoverX > CHART_WIDTH * 0.6;

  return (
    <section className="glass-panel rounded-[32px] border border-white/5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-light">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Order Volume</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Last {data.length || 14} Days</h2>
          </div>
        </div>
        {hasData ? (
          <div className="flex items-center gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.idr }} aria-hidden="true" />
              IDR
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette.inr }} aria-hidden="true" />
              INR
            </span>
          </div>
        ) : null}
      </div>

      {!hasData || totalOrders === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
          No orders in this window yet. The trend will appear once there's some order history to show.
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative mt-5 touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-auto w-full" role="img" aria-label="Daily order volume, IDR and INR">
            {chart.yTicks.map((tick) => {
              const y = chart.yFor(tick);
              return (
                <g key={tick}>
                  <line
                    x1={PAD_LEFT}
                    x2={CHART_WIDTH - PAD_RIGHT}
                    y1={y}
                    y2={y}
                    stroke={ink.gridline}
                    strokeWidth="1"
                  />
                  <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize="9" fill={ink.axisText}>
                    {tick}
                  </text>
                </g>
              );
            })}

            {chart.xLabels.map(({ index, day }) => (
              <text
                key={day.date}
                x={chart.xFor(index)}
                y={CHART_HEIGHT - 6}
                textAnchor="middle"
                fontSize="9"
                fill={ink.axisText}
              >
                {DAY_FORMATTER.format(parseDayKey(day.date))}
              </text>
            ))}

            <path d={chart.idrArea} fill={palette.idr} opacity="0.1" stroke="none" />
            <path d={chart.inrArea} fill={palette.inr} opacity="0.1" stroke="none" />

            <path d={chart.idrLine} fill="none" stroke={palette.idr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={chart.inrLine} fill="none" stroke={palette.inr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {(() => {
              const lastIndex = data.length - 1;
              const lastX = chart.xFor(lastIndex);
              return (
                <>
                  <circle cx={lastX} cy={chart.yFor(data[lastIndex].idr)} r="4" fill={palette.idr} stroke={ink.dotRing} strokeWidth="2" />
                  <circle cx={lastX} cy={chart.yFor(data[lastIndex].inr)} r="4" fill={palette.inr} stroke={ink.dotRing} strokeWidth="2" />
                </>
              );
            })()}

            {hoverIndex !== null ? (
              <>
                <line
                  x1={hoverX}
                  x2={hoverX}
                  y1={PAD_TOP}
                  y2={PAD_TOP + chart.plotHeight}
                  stroke={ink.crosshair}
                  strokeWidth="1"
                />
                <circle cx={hoverX} cy={chart.yFor(hovered.idr)} r="4" fill={palette.idr} stroke={ink.dotRing} strokeWidth="2" />
                <circle cx={hoverX} cy={chart.yFor(hovered.inr)} r="4" fill={palette.inr} stroke={ink.dotRing} strokeWidth="2" />
              </>
            ) : null}
          </svg>

          {hoverIndex !== null && hovered ? (
            <div
              className="dialog-surface pointer-events-none absolute top-0 z-10 min-w-[132px] rounded-xl border border-white/10 px-3 py-2 text-xs shadow-xl"
              style={{
                left: tooltipOnRight ? undefined : `${(hoverX / CHART_WIDTH) * 100}%`,
                right: tooltipOnRight ? `${100 - (hoverX / CHART_WIDTH) * 100}%` : undefined
              }}
            >
              <p className="font-semibold text-white">
                {WEEKDAY_FORMATTER.format(parseDayKey(hovered.date))}, {DAY_FORMATTER.format(parseDayKey(hovered.date))}
              </p>
              <p className="mt-1.5 flex items-center justify-between gap-3 text-white/65">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-full" style={{ background: palette.idr }} />
                  IDR
                </span>
                <span className="font-semibold text-white">{hovered.idr}</span>
              </p>
              <p className="mt-1 flex items-center justify-between gap-3 text-white/65">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-full" style={{ background: palette.inr }} />
                  INR
                </span>
                <span className="font-semibold text-white">{hovered.inr}</span>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
