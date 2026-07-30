import { describe, expect, it } from "vitest";

import { toClientDto } from "@/lib/client-dto";

describe("toClientDto", () => {
  it("maps nested Date, Decimal-like, and bigint values without JSON serialization", () => {
    const date = new Date("2026-07-29T15:30:00.000Z");
    const decimal = {
      d: [12345],
      e: 2,
      s: 1,
      toFixed: () => "123.45",
    };

    expect(
      toClientDto({
        id: "record-1",
        date,
        amount: decimal,
        count: BigInt(42),
        children: [{ date: null }, { date }],
      })
    ).toEqual({
      id: "record-1",
      date: "2026-07-29T15:30:00.000Z",
      amount: "123.45",
      count: "42",
      children: [{ date: null }, { date: "2026-07-29T15:30:00.000Z" }],
    });
  });

  it("does not mutate service results while creating the client DTO", () => {
    const input = {
      createdAt: new Date("2026-07-29T15:30:00.000Z"),
      nested: { active: true },
    };
    const output = toClientDto(input);

    expect(input.createdAt).toBeInstanceOf(Date);
    expect(output).not.toBe(input);
    expect(output.nested).not.toBe(input.nested);
  });
});
