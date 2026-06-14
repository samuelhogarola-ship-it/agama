import Link from "next/link";
import { Boxes, CircleUserRound, MessageSquareText, Search, ShoppingBag } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Productos" },
  { href: "/pedidos", label: "Mis pedidos" },
  { href: "/mensajes", label: "Mensajes" },
  { href: "/perfil", label: "Perfil" },
] as const;

export function CustomerShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/94 backdrop-blur">
        <div className="page-frame flex items-center gap-4 py-4">
          <Logo />
          <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface-soft px-4 py-3 lg:flex">
            <Search className="size-4 text-muted" strokeWidth={2} />
            <span className="truncate text-sm text-muted">
              Buscar productos, categorias, aplicaciones o codigos...
            </span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-brand-soft hover:text-brand",
                  active === item.href && "bg-brand text-white hover:bg-brand hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <Button variant="secondary" size="sm" asChild>
              <Link href="/mensajes">
                <MessageSquareText className="size-4" />
                Contactar
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/login">
                <CircleUserRound className="size-4" />
                Acceder
              </Link>
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <div className="rounded-full border border-line p-2 text-brand">
              <Boxes className="size-4" />
            </div>
            <div className="rounded-full border border-line p-2 text-brand">
              <ShoppingBag className="size-4" />
            </div>
          </div>
        </div>
      </header>
      <main className="relative">{children}</main>
      <MobileNav active={active} />
    </div>
  );
}
