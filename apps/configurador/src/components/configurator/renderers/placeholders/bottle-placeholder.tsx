import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function BottlePlaceholder({
  fill,
  stroke,
  detail,
  highlight,
  shadow,
}: {
  fill: string;
  stroke: string;
  detail: string;
  highlight: string;
  shadow: string;
}) {
  return (
    <g>
      <ellipse cx="214" cy="294" rx="70" ry="16" fill={shadow} opacity="0.22" />
      <path
        d="M182 74h64v24l16 20v112c0 28-22 50-48 50s-48-22-48-50V118l16-20z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      <rect x="188" y="60" width="52" height="18" rx="8" fill={detail} stroke={stroke} strokeWidth="2.5" />
      <path d="M166 126h96" stroke={highlight} strokeWidth="5" opacity="0.58" />
      <path d="M174 198h80" stroke="rgba(44, 59, 89, 0.15)" strokeWidth="4" />
      <AgamaEmbossMark x={170} y={150} width={88} height={28} />
    </g>
  );
}
