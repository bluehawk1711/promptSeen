"use client";

import {
  Grid,
} from "@visx/grid";
import {
  scaleTime,
  scaleLinear,
} from "@visx/scale";

// Use d3-shape directly instead of @visx/vendor for reliable types
import { area, curveMonotoneX } from "d3-shape";

interface DataPoint {
  date: Date;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  color?: string;
  className?: string;
}

export function AreaChart({
  data,
  width,
  height,
  margin = { top: 20, right: 20, bottom: 40, left: 50 },
  color = "hsl(var(--primary))",
  className,
}: AreaChartProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleTime({
    domain: [
      data[0]?.date ?? new Date(),
      data[data.length - 1]?.date ?? new Date(),
    ],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value), 1)],
    range: [innerHeight, 0],
    nice: true,
  });

  const areaGenerator = area<DataPoint>()
    .x((d) => xScale(d.date))
    .y0(innerHeight)
    .y1((d) => yScale(d.value))
    .curve(curveMonotoneX);

  return (
    <div className={className} style={{ width, height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            numTicksRows={4}
            numTicksColumns={6}
          />
          <path
            d={areaGenerator(data) ?? ""}
            fill={color}
            fillOpacity={0.15}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
