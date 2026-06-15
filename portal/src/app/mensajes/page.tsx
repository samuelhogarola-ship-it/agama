import { CustomerShell } from "@/components/customer-shell";
import { MessagesWorkspace } from "@/components/messages-workspace";
import { listPortalConversations } from "@/lib/portal-repository";

export default async function MessagesPage() {
  const conversations = await listPortalConversations();

  return (
    <CustomerShell active="/mensajes">
      <MessagesWorkspace initialConversations={conversations} />
    </CustomerShell>
  );
}
