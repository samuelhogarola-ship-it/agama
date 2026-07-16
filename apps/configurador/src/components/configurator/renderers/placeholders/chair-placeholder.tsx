import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function ChairPlaceholder({
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
      <ellipse cx="214" cy="292" rx="110" ry="16" fill={shadow} opacity="0.18" />
      <rect x="158" y="84" width="112" height="88" rx="28" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="144" y="178" width="140" height="32" rx="16" fill={detail} stroke={stroke} strokeWidth="2.5" />
      <path d="M168 210l-26 70" stroke={stroke} strokeWidth="10" strokeLinecap="round" />
      <path d="M260 210l26 70" stroke={stroke} strokeWidth="10" strokeLinecap="round" />
      <path d="M184 210l-10 68" stroke="rgba(44, 59, 89, 0.26)" strokeWidth="8" strokeLinecap="round" />
      <path d="M244 210l10 68" stroke="rgba(44, 59, 89, 0.26)" strokeWidth="8" strokeLinecap="round" />
      <path d="M170 106h84" stroke={highlight} strokeWidth="6" opacity="0.58" />
      <AgamaEmbossMark x={174} y={116} width={84} height={28} />
    </g>
  );
}
