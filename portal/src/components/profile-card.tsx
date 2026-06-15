import { Building2, Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CustomerProfile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: CustomerProfile }) {
  return (
    <section className="page-frame section-gap">
      <div className="space-y-5">
        <div className="editorial-panel p-6">
          <div className="relative z-10 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="label-kicker">
                <Building2 className="size-4" />
                Perfil de cliente
              </p>
              <h1 className="mt-3 section-heading font-bold text-graphite">Cuenta comercial AGAMA</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
                Aqui concentramos identidad comercial, contacto y datos de operacion para pedir con
                menos friccion y menos retrabajo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="glass-band rounded-[1.4rem] px-4 py-4">
                <div className="flex items-center gap-2 text-brand">
                  <ShieldCheck className="size-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Cuenta validada</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Perfil listo para pedidos, soporte y seguimiento comercial.
                </p>
              </div>
              <div className="glass-band rounded-[1.4rem] px-4 py-4">
                <div className="flex items-center gap-2 text-brand">
                  <Truck className="size-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Envio preferente</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Direccion de entrega visible para acelerar validacion operativa.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoField icon={Building2} label="Empresa" value={profile.company} />
              <InfoField icon={Mail} label="Contacto" value={`${profile.contactName} · ${profile.email}`} />
              <InfoField icon={Phone} label="Telefono" value={profile.phone} />
              <InfoField icon={MapPin} label="Preferencia" value={profile.contactPreference} />
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
            <Badge variant="brand">Fiscal y logistica</Badge>
            <div className="mt-5 space-y-4 text-sm leading-7 text-muted">
              <div className="rounded-[1.25rem] border border-line bg-surface-soft p-4">
                <p className="font-semibold text-graphite">RFC / datos fiscales</p>
                <p className="mt-1">{profile.taxId}</p>
              </div>
              <div className="rounded-[1.25rem] border border-line bg-surface-soft p-4">
                <p className="font-semibold text-graphite">Direccion fiscal</p>
                <p className="mt-1">{profile.billingAddress}</p>
              </div>
              <div className="rounded-[1.25rem] border border-line bg-surface-soft p-4">
                <p className="font-semibold text-graphite">Direccion de envio</p>
                <p className="mt-1">{profile.shippingAddress}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-line bg-surface-soft p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 text-sm leading-7 text-graphite">{value}</p>
    </div>
  );
}
