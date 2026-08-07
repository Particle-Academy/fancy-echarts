import { afterEach, describe, expect, it, vi } from "vitest";
import { cn } from "../src/utils/cn";

describe("cn", () => {
    it("joins plain strings and numbers", () => {
        expect(cn("a", 1, "b")).toBe("a 1 b");
    });

    it("drops falsy values so a conditional class does not leave a gap", () => {
        // `cond && "cls"` is the common shape. Emitting "false" or a double
        // space into className is the usual result of getting this wrong.
        expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
    });

    it("takes an object and keeps only the truthy keys", () => {
        expect(cn({ active: true, disabled: false, "is-open": 1 })).toBe("active is-open");
    });

    it("flattens nested arrays", () => {
        expect(cn(["a", ["b", ["c"]]])).toBe("a b c");
    });

    it("returns an empty string when everything is falsy", () => {
        // Not "undefined" and not " " — an empty className attribute.
        expect(cn(false, null, undefined)).toBe("");
    });

    it("mixes every input shape in one call", () => {
        expect(cn("base", ["x", null], { on: true, off: false }, undefined, 2)).toBe("base x on 2");
    });
});

describe("register", () => {
    afterEach(() => {
        vi.resetModules();
        vi.doUnmock("echarts/core");
    });

    it("registers charts, components and renderers in one call", async () => {
        const use = vi.fn();
        vi.doMock("echarts/core", () => ({ use }));

        const { registerAll } = await import("../src/utils/register");
        registerAll();

        expect(use).toHaveBeenCalledTimes(1);
        // One flat array covering all three groups — ECharts fails at render
        // time, not import time, when a piece is missing, so a partial
        // registration surfaces as a blank chart.
        const [registered] = use.mock.calls[0]!;
        expect(Array.isArray(registered)).toBe(true);
        expect((registered as unknown[]).length).toBeGreaterThan(10);
    });

    it("is idempotent, so calling it from several entry points is safe", async () => {
        // The showcase calls it from both the browser and SSR entries.
        const use = vi.fn();
        vi.doMock("echarts/core", () => ({ use }));

        const { registerAll } = await import("../src/utils/register");
        registerAll();
        registerAll();
        registerAll();

        expect(use).toHaveBeenCalledTimes(1);
    });

    it("registers only what was asked for on the tree-shaking path", async () => {
        const use = vi.fn();
        vi.doMock("echarts/core", () => ({ use }));

        const mod = await import("../src/utils/register");
        mod.registerCharts(mod.LineChart as never);

        expect(use).toHaveBeenCalledTimes(1);
        expect((use.mock.calls[0]![0] as unknown[])).toHaveLength(1);
    });

    it("does not mark the registry as complete when only some charts registered", async () => {
        // registerCharts must NOT set the idempotency flag: a consumer that
        // registers a line chart and later calls registerAll for a dashboard
        // would otherwise get nothing, and the second chart would render blank.
        const use = vi.fn();
        vi.doMock("echarts/core", () => ({ use }));

        const mod = await import("../src/utils/register");
        mod.registerCharts(mod.LineChart as never);
        mod.registerAll();

        expect(use).toHaveBeenCalledTimes(2);
    });
});
