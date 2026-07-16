import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  href = "/",
  className,
}: {
  compact?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Image
        src={compact ? "/brand/logo-circulo.png" : "/brand/agama.svg"}
        alt="AGAMA Colores"
        width={compact ? 52 : 160}
        height={compact ? 52 : 52}
        priority
        className={compact ? "size-11 rounded-2xl" : "h-10 w-auto md:h-11"}
      />
    </Link>
  );
}
