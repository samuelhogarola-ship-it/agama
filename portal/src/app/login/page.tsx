import Link from "next/link";
import { ArrowRight, BadgeCheck, KeyRound } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="page-frame flex min-h-screen items-center justify-center py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_28px_70px_rgba(17,46,122,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="noise-dots relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3ff_100%)] p-8 lg:p-10">
          <Logo />
          <div className="mt-12 max-w-md space-y-5">
            <p className="label-kicker">
              <BadgeCheck className="size-4" />
              Acceso comercial AGAMA
            </p>
            <h1 className="headline-display max-w-[6ch] font-bold text-brand">
              ENTRA AL
              <span className="headline-accent block">PORTAL.</span>
            </h1>
            <p className="text-base leading-7 text-muted">
              Consulta catalogo, historial de pedidos, mensajes y perfil de cliente desde una sola
              experiencia.
            </p>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="mx-auto max-w-md space-y-5">
            <div>
              <p className="label-kicker">
                <KeyRound className="size-4" />
                Inicio de sesion
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-graphite">Bienvenido de vuelta</h2>
            </div>
            <div className="space-y-4">
              <Input type="email" placeholder="Correo comercial" />
              <Input type="password" placeholder="Contrasena" />
              <Button className="w-full justify-center" asChild>
                <Link href="/catalogo">
                  Entrar al portal
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p className="text-sm leading-6 text-muted">
              Esta implementacion deja la pantalla lista para conectar Supabase Auth sin bloquear la
              navegacion del MVP.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
