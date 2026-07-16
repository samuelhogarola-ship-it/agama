import { cn } from "@/lib/utils";
import type { AgamaConfiguratorProductId } from "@/lib/configurator-types";

const glyphMap: Record<AgamaConfiguratorProductId, React.ReactNode> = {
  bucket: (
    <>
      <ellipse cx="36" cy="63" rx="19" ry="4" fill="rgba(20,57,171,0.14)" />
      <path
        d="M19 21c2-5 6-7 12-7h10c6 0 10 2 12 7l3 29c1 7-4 12-12 12H28c-8 0-13-5-12-12z"
        fill="url(#bucketFill)"
        stroke="#1a57d8"
        strokeWidth="1.5"
      />
      <ellipse cx="36" cy="21" rx="20" ry="5" fill="#2a6cff" opacity="0.3" />
      <path d="M24 16c2-3 7-5 12-5 6 0 10 2 13 5" fill="none" stroke="#1240ac" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  lid: (
    <>
      <ellipse cx="36" cy="60" rx="21" ry="4" fill="rgba(20,57,171,0.12)" />
      <ellipse cx="36" cy="36" rx="22" ry="10" fill="#c9d0db" stroke="#7f8b9f" strokeWidth="1.5" />
      <ellipse cx="36" cy="35" rx="16" ry="6" fill="#eef2f8" stroke="#a5afbf" strokeWidth="1" />
    </>
  ),
  bottle: (
    <>
      <ellipse cx="36" cy="61" rx="11" ry="3.5" fill="rgba(20,57,171,0.12)" />
      <path
        d="M31 16h10v5l3 5v24c0 7-4 12-8 12s-8-5-8-12V26l3-5z"
        fill="#ffffff"
        stroke="#b8c3d3"
        strokeWidth="1.5"
      />
      <rect x="32" y="12" width="8" height="5" rx="2" fill="#4d5b72" />
    </>
  ),
  cup: (
    <>
      <ellipse cx="36" cy="61" rx="12" ry="3.5" fill="rgba(20,57,171,0.12)" />
      <path d="M25 24h22l-2 25c-1 6-4 11-9 11s-8-5-9-11z" fill="#ffffff" stroke="#cad5e5" strokeWidth="1.5" />
      <ellipse cx="36" cy="24" rx="12" ry="3.8" fill="#eef3f9" stroke="#cad5e5" strokeWidth="1.2" />
    </>
  ),
  chair: (
    <>
      <path d="M28 20h18c4 0 7 3 7 7v10H24V24c0-2 2-4 4-4z" fill="#7d8593" />
      <rect x="22" y="38" width="32" height="8" rx="4" fill="#8d95a3" />
      <path d="M28 46l-6 16" stroke="#525c6d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M48 46l6 16" stroke="#525c6d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 46l-2 15" stroke="#626b7b" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 46l2 15" stroke="#626b7b" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  container: (
    <>
      <ellipse cx="36" cy="62" rx="19" ry="4" fill="rgba(20,57,171,0.12)" />
      <rect x="17" y="25" width="38" height="24" rx="5" fill="#747f8d" stroke="#596575" strokeWidth="1.5" />
      <rect x="20" y="21" width="32" height="6" rx="3" fill="#9ca6b4" stroke="#7e8999" strokeWidth="1.2" />
      <path d="M25 25v24" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
      <path d="M47 25v24" stroke="rgba(30,41,59,0.22)" strokeWidth="1.5" />
    </>
  ),
};

export function ProductGlyph({
  productId,
  className,
}: {
  productId: AgamaConfiguratorProductId;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 72 72" className={cn("h-14 w-14 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="bucketFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2380ff" />
          <stop offset="100%" stopColor="#1447c5" />
        </linearGradient>
      </defs>
      {glyphMap[productId]}
    </svg>
  );
}
