import { describe, expect, it } from "vitest";
import { getDashboardCaseSelection } from "../client/src/lib/dashboardCaseNavigation";

describe("dashboard case navigation", () => {
  it("opens the conversation detail and preserves ticket context", () => {
    expect(getDashboardCaseSelection({ id: "conv_1", conversationPublicId: "conv_1", ticketNo: "CS-1" })).toEqual({ conversationPublicId: "conv_1", ticketNo: "CS-1" });
  });

  it("falls back to the case id for conversations without a ticket", () => {
    expect(getDashboardCaseSelection({ id: "conv_2" })).toEqual({ conversationPublicId: "conv_2", ticketNo: null });
  });
});
