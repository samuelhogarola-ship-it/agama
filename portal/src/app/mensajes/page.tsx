import { CustomerShell } from "@/components/customer-shell";
import { MessagesWorkspace } from "@/components/messages-workspace";
import { listConversations } from "@/lib/mock-store";

export default function MessagesPage() {
  return (
    <CustomerShell active="/mensajes">
      <MessagesWorkspace initialConversations={listConversations()} />
    </CustomerShell>
  );
}
