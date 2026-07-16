import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function ContainerPlaceholder({
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
      <ellipse cx="214" cy="294" rx="120" ry="18" fill={shadow} opacity="0.2" />
      <rect x="118" y="96" width="192" height="146" rx="26" fill={fill} stroke={stroke} strokeWidth="2.5" />
      <rect x="132" y="82" width="164" height="24" rx="12" fill={detail} stroke={stroke} strokeWidth="2.5" />
      <path d="M136 136h156" stroke={highlight} strokeWidth="6" opacity="0.58" />
      <path d="M156 96v146" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M272 96v146" stroke="rgba(44, 59, 89, 0.16)" strokeWidth="3" />
      <AgamaEmbossMark x={156} y={150} width={116} height={36} />
    </g>
  );
}
