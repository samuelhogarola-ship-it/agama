import { CustomerShell } from "@/components/customer-shell";
import { ProfileCard } from "@/components/profile-card";
import { getPortalCustomerProfile } from "@/lib/portal-repository";

export default async function ProfilePage() {
  const profile = await getPortalCustomerProfile();

  return (
    <CustomerShell active="/perfil">
      <ProfileCard profile={profile} />
    </CustomerShell>
  );
}
