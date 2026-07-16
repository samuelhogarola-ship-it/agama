import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function LidPlaceholder({
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
      <ellipse cx="214" cy="288" rx="122" ry="18" fill={shadow} opacity="0.24" />
      <ellipse cx="214" cy="188" rx="124" ry="58" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <ellipse cx="214" cy="184" rx="90" ry="34" fill={detail} opacity="0.78" />
      <ellipse cx="214" cy="180" rx="62" ry="20" fill="#f9fbff" opacity="0.75" />
      <rect x="197" y="136" width="34" height="28" rx="10" fill={detail} stroke={stroke} strokeWidth="2.5" />
      <path d="M112 176c24-24 80-38 152-21" fill="none" stroke={highlight} strokeWidth="6" opacity="0.62" />
      <AgamaEmbossMark x={162} y={186} width={104} height={34} />
    </g>
  );
}
