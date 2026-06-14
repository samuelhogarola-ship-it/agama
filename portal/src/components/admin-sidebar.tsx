import Link from "next/link";
import { Boxes, LayoutList, MessageSquareText, Shapes, UsersRound } from "lucide-react";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/pedidos", label: "Pedidos", icon: LayoutList },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/clientes", label: "Clientes", icon: UsersRound },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageSquareText },
  { href: "/admin/categorias", label: "Categorias", icon: Shapes },
] as const;

export function AdminSidebar({ active }: { active: string }) {
  return (
    <aside className="hidden w-[270px] shrink-0 border-r border-line bg-white/88 p-5 backdrop-blur xl:flex xl:flex-col">
      <Logo />
      <div className="mt-8 space-y-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm font-semibold text-muted transition hover:bg-brand-soft hover:text-brand",
                active === item.href && "bg-brand text-white hover:bg-brand hover:text-white",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
