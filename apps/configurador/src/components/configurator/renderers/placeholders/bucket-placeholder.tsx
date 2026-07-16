import { AgamaEmbossMark } from "@/components/configurator/renderers/agama-emboss-mark";

export function BucketPlaceholder({
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
      <ellipse cx="214" cy="298" rx="118" ry="20" fill="rgba(16, 25, 51, 0.16)" />
      <ellipse cx="214" cy="292" rx="94" ry="14" fill="rgba(255,255,255,0.32)" />
      <path
        d="M118 108c8-24 27-38 57-40h79c30 2 49 16 57 40l10 112c4 37-24 69-61 69h-92c-37 0-65-32-61-69z"
        fill={shadow}
        opacity="0.16"
      />
      <path
        d="M126 96c7-17 26-28 49-28h74c23 0 42 11 49 28l14 124c3 30-21 56-53 56h-92c-32 0-56-26-53-56z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      <ellipse cx="214" cy="96" rx="89" ry="23" fill={detail} opacity="0.95" />
      <ellipse cx="214" cy="97" rx="72" ry="13.5" fill="rgba(255,255,255,0.76)" />
      <path d="M134 110h160" stroke={highlight} strokeWidth="4" strokeLinecap="round" opacity="0.74" />
      <path d="M132 135h164" stroke="rgba(255,255,255,0.38)" strokeWidth="3" opacity="0.9" />
      <path d="M129 158h170" stroke="rgba(255,255,255,0.34)" strokeWidth="3" opacity="0.82" />
      <path d="M128 186h172" stroke="rgba(255,255,255,0.28)" strokeWidth="3" opacity="0.76" />
      <path d="M161 110v154" stroke="rgba(255,255,255,0.28)" strokeWidth="4" strokeLinecap="round" />
      <path d="M257 108v158" stroke="rgba(83,97,124,0.16)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M157 74c9-13 27-21 57-21s48 8 57 21"
        fill="none"
        stroke={stroke}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M143 152c0-22 13-42 31-53"
        fill="none"
        stroke={highlight}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.62"
      />
      <path
        d="M285 152c0-22-13-42-31-53"
        fill="none"
        stroke="rgba(44, 59, 89, 0.22)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path d="M196 102h36" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
      <AgamaEmbossMark x={148} y={154} width={132} height={44} />
    </g>
  );
}
