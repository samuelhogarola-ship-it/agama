import Link from "next/link";
import { Boxes, MessageSquareText, ShoppingBag, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/catalogo", label: "Productos", icon: Boxes },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/mensajes", label: "Mensajes", icon: MessageSquareText },
  { href: "/perfil", label: "Perfil", icon: UserRound },
] as const;

export function MobileNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/96 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const selected = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-muted transition",
                selected && "bg-brand text-white shadow-[0_12px_24px_rgba(20,57,171,0.22)]",
              )}
            >
              <Icon className="size-4" strokeWidth={selected ? 2.2 : 1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
