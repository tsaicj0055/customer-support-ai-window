export type DashboardCaseTarget = {
  id: string;
  conversationPublicId?: string;
  ticketNo?: string | null;
};

export function getDashboardCaseSelection(item: DashboardCaseTarget) {
  return {
    conversationPublicId: item.conversationPublicId ?? item.id,
    ticketNo: item.ticketNo ?? null,
  };
}
