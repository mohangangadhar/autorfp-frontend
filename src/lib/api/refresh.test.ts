import { describe, it, expect } from "vitest";
import { runSingleFlight, __resetSingleFlight } from "@/lib/api/refresh";

describe("runSingleFlight", () => {
  it("dedupes concurrent callers into a single run", async () => {
    let runs = 0;
    const result = runSingleFlight(async () => {
      runs += 1;
      return true;
    });

    const first = await runSingleFlight(async () => true);
    const second = await runSingleFlight(async () => true);
    const third = await runSingleFlight(async () => true);

    await result; // wait for the initial trigger
    expect(runs).toBe(1);
    expect([first, second, third]).toContain(true);
    __resetSingleFlight();
  });

  it("refreshes again after the first completes", async () => {
    let runs = 0;
    const run = async () => {
      runs += 1;
      return true;
    };
    await runSingleFlight(run);
    await runSingleFlight(run);
    expect(runs).toBe(2);
    __resetSingleFlight();
  });

  it("propagates the promise result", async () => {
    __resetSingleFlight();
    const out = await runSingleFlight(async () => false);
    expect(out).toBe(false);
    __resetSingleFlight();
  });
});