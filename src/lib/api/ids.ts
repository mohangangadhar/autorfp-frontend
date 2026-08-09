/**
 * Identifier + correlation helpers.
 *
 * Correlation ids follow the "corr_<ulid>" convention from
 * observability-design.md §1 and the transport contract §1.
 */

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function entropySource(): () => number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const arr = new Uint8Array(32);
    return () => {
      crypto.getRandomValues(arr);
      return (arr[Math.floor(Math.random() * arr.length)] as number) % 32;
    };
  }
  return () => Math.floor(Math.random() * 32);
}

/** Crockford base-32 ULID (26 chars): 10-char timestamp + 16-char randomness. */
export function ulid(time = Date.now(), rand?: () => number): string {
  const next = rand ?? entropySource();

  let ts = time;
  const timeChars: string[] = [];
  for (let i = 0; i < 10; i++) {
    timeChars.unshift(CROCKFORD_BASE32[ts % 32] ?? "0");
    ts = Math.floor(ts / 32);
  }

  const randomChars: string[] = [];
  for (let i = 0; i < 16; i++) {
    randomChars.push(CROCKFORD_BASE32[next()] ?? "0");
  }

  return `${timeChars.join("")}${randomChars.join("")}`;
}

/** Correlation id (`corr_...`) attached to every outbound request. */
export function generateCorrelationId(rand?: () => number): string {
  return `corr_${ulid(Date.now(), rand)}`;
}

/** Fresh entity id (ULID for backend compatibility). */
export function newEntityId(rand?: () => number): string {
  return ulid(Date.now(), rand);
}