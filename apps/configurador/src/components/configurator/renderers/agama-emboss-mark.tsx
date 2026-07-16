"use client";

import { useId } from "react";

export function AgamaEmbossMark({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const shadowId = useId().replace(/:/g, "");
  const highlightId = useId().replace(/:/g, "");

  return (
    <g opacity="0.26">
      <defs>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="1.4" dy="1.4" />
          <feGaussianBlur stdDeviation="1.8" result="shadow" />
          <feColorMatrix
            in="shadow"
            type="matrix"
            values="0 0 0 0 0.2 0 0 0 0 0.25 0 0 0 0 0.32 0 0 0 0.45 0"
          />
        </filter>
        <filter id={highlightId} x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="-1.2" dy="-1.2" />
          <feGaussianBlur stdDeviation="1.6" result="highlight" />
          <feColorMatrix
            in="highlight"
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.68 0"
          />
        </filter>
      </defs>

      <image
        href="/brand/agama.svg"
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${highlightId})`}
      />
      <image
        href="/brand/agama.svg"
        x={x}
        y={y}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${shadowId})`}
      />
    </g>
  );
}
