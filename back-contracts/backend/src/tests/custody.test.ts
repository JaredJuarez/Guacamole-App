import { describe, expect, it } from "vitest";
import { assertValidRoleTransition } from "@guacamole/shared";

describe("custody transitions", () => {
  it("allows the expected sequence", () => {
    expect(() => assertValidRoleTransition("producer", "transporter")).not.toThrow();
    expect(() => assertValidRoleTransition("transporter", "inspector")).not.toThrow();
    expect(() => assertValidRoleTransition("inspector", "distributor")).not.toThrow();
  });

  it("rejects out-of-order transitions", () => {
    expect(() => assertValidRoleTransition("producer", "inspector")).toThrow();
    expect(() => assertValidRoleTransition("transporter", "distributor")).toThrow();
  });
});

