import { Building2, Mail, MapPin, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { CustomerProfile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: CustomerProfile }) {
  return (
    <section className="page-frame section-gap">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.8rem] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
          <p className="label-kicker">
            <Building2 className="size-4" />
            Perfil de cliente
          </p>
          <h1 className="mt-3 section-heading font-bold text-graphite">Cuenta comercial AGAMA</h1>
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
            <div>
              <p className="font-semibold text-graphite">RFC / datos fiscales</p>
              <p>{profile.taxId}</p>
            </div>
            <div>
              <p className="font-semibold text-graphite">Direccion fiscal</p>
              <p>{profile.billingAddress}</p>
            </div>
            <div>
              <p className="font-semibold text-graphite">Direccion de envio</p>
              <p>{profile.shippingAddress}</p>
            </div>
          </div>
        </article>
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
