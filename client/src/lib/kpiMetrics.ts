export type MetricPeriod = "today" | "7d" | "current";

export type SupportCaseMetric = {
  id: string;
  conversationPublicId?: string;
  ticketNo?: string | null;
  channel?: string | null;
  intent?: string | null;
  summary?: string | null;
  reason?: string | null;
  missingFields?: string[];
  createdAt: string;
  firstResponseSeconds: number | null;
  handedOff: boolean;
  resolved: boolean;
  status?: string;
};

export type KpiMetrics = {
  averageFirstResponseSeconds: number | null;
  handoffRate: number | null;
  resolutionRate: number | null;
  totalCases: number;
  respondedCases: number;
  handoffCases: number;
  resolvedCases: number;
  cases: SupportCaseMetric[];
};

export const demoPreviousKpis: KpiMetrics = {
  averageFirstResponseSeconds: 138,
  handoffRate: 0.4,
  resolutionRate: 0.6,
  totalCases: 0,
  respondedCases: 0,
  handoffCases: 0,
  resolvedCases: 0,
  cases: [],
};

export const demoCaseMetrics: SupportCaseMetric[] = [
  { id: "CASE-018", createdAt: "2026-08-26T08:10:00Z", firstResponseSeconds: 74, handedOff: true, resolved: false },
  { id: "CASE-017", createdAt: "2026-08-26T07:40:00Z", firstResponseSeconds: 98, handedOff: false, resolved: true },
  { id: "CASE-016", createdAt: "2026-08-26T06:25:00Z", firstResponseSeconds: 121, handedOff: false, resolved: true },
  { id: "CASE-015", createdAt: "2026-08-25T09:15:00Z", firstResponseSeconds: 156, handedOff: true, resolved: false },
  { id: "CASE-014", createdAt: "2026-08-24T11:00:00Z", firstResponseSeconds: 83, handedOff: false, resolved: true },
  { id: "CASE-013", createdAt: "2026-08-23T04:20:00Z", firstResponseSeconds: 132, handedOff: true, resolved: false },
  { id: "CASE-012", createdAt: "2026-08-22T03:10:00Z", firstResponseSeconds: 105, handedOff: false, resolved: true },
];

const periodStart = (period: MetricPeriod, now = new Date("2026-08-26T12:00:00Z")) => {
  if (period === "today") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return null;
};

export type CurrentCaseState = {
  intent?: string;
  needsHuman: boolean;
  resolutionType?: string;
};

export function toCurrentCaseMetric(state: CurrentCaseState): SupportCaseMetric {
  return {
    id: "CURRENT",
    createdAt: new Date().toISOString(),
    firstResponseSeconds: null,
    handedOff: state.needsHuman,
    resolved: !state.needsHuman && state.resolutionType === "DIRECT_ANSWER",
  };
}

export function filterCasesByPeriod(cases: SupportCaseMetric[], period: MetricPeriod) {
  if (period === "current") return cases.slice(0, 1);
  const start = periodStart(period);
  return cases.filter((item) => start && new Date(item.createdAt) >= start);
}

export function calculateKpis(cases: SupportCaseMetric[]): KpiMetrics {
  const responded = cases.filter((item) => item.firstResponseSeconds !== null);
  const handoffs = cases.filter((item) => item.handedOff);
  const resolved = cases.filter((item) => item.resolved);
  return {
    averageFirstResponseSeconds: responded.length ? Math.round(responded.reduce((sum, item) => sum + (item.firstResponseSeconds ?? 0), 0) / responded.length) : null,
    handoffRate: cases.length ? handoffs.length / cases.length : null,
    resolutionRate: cases.length ? resolved.length / cases.length : null,
    totalCases: cases.length,
    respondedCases: responded.length,
    handoffCases: handoffs.length,
    resolvedCases: resolved.length,
    cases,
  };
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} 分 ${remainder} 秒` : `${minutes} 分鐘`;
}

export function formatRate(rate: number | null) {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function rateDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return Math.round((current - previous) * 100);
}

export function secondsDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  return current - previous;
}
