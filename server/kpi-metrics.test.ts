import { describe, expect, it } from "vitest";
import { calculateKpis, demoCaseMetrics, filterCasesByPeriod, formatDuration, formatRate, rateDelta, secondsDelta, toCurrentCaseMetric } from "../client/src/lib/kpiMetrics";

describe("support operations KPIs", () => {
  it("calculates response time, handoff rate, and resolution rate", () => {
    const metrics = calculateKpis(demoCaseMetrics.slice(0, 3));
    expect(metrics.averageFirstResponseSeconds).toBe(98);
    expect(metrics.handoffRate).toBeCloseTo(1 / 3);
    expect(metrics.resolutionRate).toBeCloseTo(2 / 3);
    expect(metrics.totalCases).toBe(3);
  });

  it("filters today, seven-day, and current-case views", () => {
    expect(filterCasesByPeriod(demoCaseMetrics, "today")).toHaveLength(3);
    expect(filterCasesByPeriod(demoCaseMetrics, "7d")).toHaveLength(7);
    expect(filterCasesByPeriod(demoCaseMetrics, "current")).toHaveLength(1);
  });

  it("calculates trend deltas with explicit units and handles missing baselines", () => {
    expect(secondsDelta(98, 138)).toBe(-40);
    expect(rateDelta(1 / 3, 0.4)).toBe(-7);
    expect(rateDelta(2 / 3, 0.6)).toBe(7);
    expect(secondsDelta(null, 138)).toBeNull();
  });

  it("models a current live case without inventing response time", () => {
    const current = calculateKpis([{ id: "CURRENT", createdAt: "2026-08-26T12:00:00Z", firstResponseSeconds: null, handedOff: true, resolved: false }]);
    expect(current.averageFirstResponseSeconds).toBeNull();
    expect(current.handoffRate).toBe(1);
    expect(current.resolutionRate).toBe(0);
    expect(current.handoffCases).toBe(1);
  });

  it("maps the live state to the current-case summary", () => {
    const handoff = toCurrentCaseMetric({ intent: "Ad Account Disabled", needsHuman: true, resolutionType: "NEED_TICKET" });
    expect(handoff.id).toBe("CURRENT");
    expect(handoff.handedOff).toBe(true);
    expect(handoff.resolved).toBe(false);
    expect(handoff.firstResponseSeconds).toBeNull();

    const direct = toCurrentCaseMetric({ intent: "Accepted Payment Method", needsHuman: false, resolutionType: "DIRECT_ANSWER" });
    expect(direct.handedOff).toBe(false);
    expect(direct.resolved).toBe(true);
  });

  it("handles empty metrics without inventing a result", () => {
    const metrics = calculateKpis([]);
    expect(metrics.averageFirstResponseSeconds).toBeNull();
    expect(metrics.handoffRate).toBeNull();
    expect(metrics.resolutionRate).toBeNull();
    expect(formatDuration(null)).toBe("—");
    expect(formatRate(null)).toBe("—");
  });
});
