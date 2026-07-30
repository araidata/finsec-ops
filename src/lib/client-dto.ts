type DecimalLike = {
  d: number[];
  e: number;
  s: number;
  toFixed: (...args: never[]) => string;
};

export type ClientDto<T> = T extends Date
  ? string
  : T extends bigint
    ? string
    : T extends DecimalLike
      ? string
      : T extends readonly (infer Item)[]
        ? ClientDto<Item>[]
        : T extends object
          ? { [Key in keyof T]: ClientDto<T[Key]> }
          : T;

function isDecimalLike(value: object): value is DecimalLike {
  const candidate = value as Partial<DecimalLike>;
  return (
    Array.isArray(candidate.d) &&
    typeof candidate.e === "number" &&
    typeof candidate.s === "number" &&
    typeof candidate.toFixed === "function"
  );
}

/**
 * Maps a server-owned result to the React Flight-safe DTO shape consumed by a
 * Client Component. Domain services should still select only fields required
 * by their page; this mapper owns the Date, Decimal, and bigint boundary.
 */
export function toClientDto<T>(value: T): ClientDto<T> {
  if (value instanceof Date) {
    return value.toISOString() as ClientDto<T>;
  }

  if (typeof value === "bigint") {
    return value.toString() as ClientDto<T>;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toClientDto(item)) as ClientDto<T>;
  }

  if (value !== null && typeof value === "object") {
    if (isDecimalLike(value)) {
      return value.toFixed() as ClientDto<T>;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toClientDto(item)])
    ) as ClientDto<T>;
  }

  return value as ClientDto<T>;
}
