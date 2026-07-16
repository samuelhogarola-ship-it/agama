import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function CupPlaceholder({
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
      <ellipse cx="214" cy="294" rx="72" ry="15" fill={shadow} opacity="0.22" />
      <path
        d="M162 102h104l-10 128c-2 27-20 46-42 46s-40-19-42-46z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      <ellipse cx="214" cy="102" rx="56" ry="13" fill={detail} stroke={stroke} strokeWidth="2.5" />
      <path d="M172 128h84" stroke={highlight} strokeWidth="5" opacity="0.62" />
      <AgamaEmbossMark x={174} y={158} width={82} height={26} />
    </g>
  );
}
