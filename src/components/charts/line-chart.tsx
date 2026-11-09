"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type LineSeries = {
  name: string;
  values: number[];
  /** CSS color, e.g. "var(--series-1)". */
  color: string;
  /** Shown next to the name in the legend (e.g. a period total). */
  legendValue?: string;
};

type Props = {
  /** Short x labels shown on the axis. */
  xLabels: string[];
  /** Longer x labels for the tooltip and table (defaults to xLabels). */
  xFull?: string[];
  series: LineSeries[];
  /** Unit for tooltip/table values, e.g. "consultations". */
  unit: string;
  height?: number;
  /** Accessible description of the chart. */
  ariaLabel: string;
  className?: string;
};

const PAD = { top: 12, bottom: 26, left: 34 };
const END_LABEL_WIDTH = 132;
const LABEL_GAP = 14;

/** Round the axis maximum up to a clean number with 4 ticks. */
function niceScale(max: number) {
  if (max <= 0) return { max: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough)!;
  const top = Math.ceil(max / step) * step;
  return {
    max: top,
    ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6)),
  };
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Line chart (dataviz method): 2px lines, recessive solid hairline grid, crosshair + tooltip
 * on hover/keyboard, legend for 2+ series, direct end labels for ≤4 series when they don't
 * collide, and a data table view.
 */
export function LineChart({
  xLabels,
  xFull = xLabels,
  series,
  unit,
  height = 220,
  ariaLabel,
  className,
}: Props) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const n = xLabels.length;
  const multi = series.length > 1;
  const { max, ticks } = niceScale(Math.max(0, ...series.flatMap((s) => s.values)));

  // Direct labels need room on the right; on narrow screens the legend + tooltip carry identity.
  const plotH = height - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const endYs = series.map((s) => y(s.values[n - 1] ?? 0));
  const sortedEnds = [...endYs].sort((a, b) => a - b);
  const labelsFit = sortedEnds.every((v, i) => i === 0 || v - sortedEnds[i - 1] >= LABEL_GAP);
  const directLabels = multi && series.length <= 4 && width >= 480 && labelsFit;
  const padRight = directLabels ? END_LABEL_WIDTH : 16;

  const plotW = Math.max(1, width - PAD.left - padRight);
  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  // Show as many x labels as fit (~56px each), always including the last.
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 56))));
  const xTickIdx = useMemo(() => {
    const idx = Array.from({ length: n }, (_, i) => i).filter((i) => (n - 1 - i) % every === 0);
    return idx;
  }, [n, every]);

  function indexFromPointer(clientX: number, rect: DOMRect) {
    const px = clientX - rect.left - PAD.left;
    return Math.min(n - 1, Math.max(0, Math.round((px / plotW) * (n - 1))));
  }

  const tooltipRows =
    active === null
      ? []
      : series
          .map((s) => ({ name: s.name, color: s.color, value: s.values[active] ?? 0 }))
          .sort((a, b) => b.value - a.value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {multi && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legend">
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              <span className="text-foreground">{s.name}</span>
              {s.legendValue && <span className="text-muted-foreground tabular-nums">{s.legendValue}</span>}
            </li>
          ))}
        </ul>
      )}

      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            aria-describedby={tableId}
            tabIndex={0}
            className="overflow-visible rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onPointerMove={(e) =>
              setActive(indexFromPointer(e.clientX, e.currentTarget.getBoundingClientRect()))
            }
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive((a) => a ?? n - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n - 1) - 1));
              else if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? 0) + 1));
              else return;
              e.preventDefault();
            }}
          >
            {/* Grid + y axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] tabular-nums"
                >
                  {t}
                </text>
              </g>
            ))}
            {/* X axis labels */}
            {xTickIdx.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}
                className="fill-muted-foreground text-[11px]"
              >
                {xLabels[i]}
              </text>
            ))}

            {/* Crosshair */}
            {active !== null && (
              <line
                x1={x(active)}
                x2={x(active)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                strokeWidth={1}
              />
            )}

            {/* Lines */}
            {series.map((s) => (
              <path
                key={s.name}
                d={s.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* End dots (or hovered points), with a 2px surface ring */}
            {series.map((s) => {
              const i = active ?? n - 1;
              return (
                <circle
                  key={s.name}
                  cx={x(i)}
                  cy={y(s.values[i] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              );
            })}

            {/* Direct end labels */}
            {directLabels &&
              series.map((s, k) => (
                <text
                  key={s.name}
                  x={x(n - 1) + 10}
                  y={endYs[k]}
                  dy="0.32em"
                  className="fill-foreground text-[11px]"
                >
                  {s.name.length > 18 ? `${s.name.slice(0, 17)}…` : s.name}
                </text>
              ))}
          </svg>
        )}

        {/* Tooltip */}
        {active !== null && width > 0 && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
            style={x(active) > width / 2 ? { right: width - x(active) + 12 } : { left: x(active) + 12 }}
          >
            <p className="mb-1 font-medium">{xFull[active]}</p>
            <ul className="flex flex-col gap-0.5">
              {tooltipRows.map((r) => (
                <li key={r.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-0.5 w-3 rounded-full"
                      style={{ background: r.color }}
                      aria-hidden
                    />
                    {multi ? r.name : unit}
                  </span>
                  <span className="font-medium tabular-nums">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Table view: the same numbers, readable without color or a pointer */}
      <details className="text-sm" id={tableId}>
        <summary className="cursor-pointer text-muted-foreground select-none hover:text-foreground">
          View data table
        </summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Period</th>
                {series.map((s) => (
                  <th key={s.name} className="px-2 py-1.5 text-right font-medium">
                    {multi ? s.name : unit}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xFull.map((label, i) => (
                <tr key={label} className="border-t">
                  <td className="px-2 py-1 whitespace-nowrap">{label}</td>
                  {series.map((s) => (
                    <td key={s.name} className="px-2 py-1 text-right tabular-nums">
                      {s.values[i] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
