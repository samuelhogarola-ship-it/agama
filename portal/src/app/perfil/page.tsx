import { CustomerShell } from "@/components/customer-shell";
import { ProfileCard } from "@/components/profile-card";
import { getCustomerProfile } from "@/lib/mock-store";

export default function ProfilePage() {
  return (
    <CustomerShell active="/perfil">
      <ProfileCard profile={getCustomerProfile()} />
    </CustomerShell>
  );
}
