import { describe, it, expect, beforeEach, vi } from "vitest";
import transferAction from "../actions/transfer";

describe("Movement Transfer Action", () => {
    describe("Action Configuration", () => {
        it("should have correct action name and triggers", () => {
            expect(transferAction.name).toBe("TRANSFER_MOVE");
            expect(transferAction.triggers).toContain("send move");
            expect(transferAction.priority).toBe(1000);
        });

        it("should validate transfer messages correctly", () => {
            const validMessage = "send 1 move to 0x123";
            const invalidMessage = "hello world";

            expect(transferAction.shouldHandle({ content: { text: validMessage }})).toBe(true);
            expect(transferAction.shouldHandle({ content: { text: invalidMessage }})).toBe(false);
        });
    });
});