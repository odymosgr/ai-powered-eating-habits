import { getRandomBytes } from "expo-crypto";

/**
 * A UUIDv7 (RFC 9562), so IDs sort by creation time. Why the phone makes them:
 * supabase/AGENTS.md.
 */
export function newId(
  now: number = Date.now(),
  random: Uint8Array = getRandomBytes(10),
): string {
  const bytes = new Uint8Array(16);

  // Arithmetic, not bit shifts: JavaScript's bitwise operators cut numbers to 32 bits.
  let time = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }

  bytes.set(random.subarray(0, 10), 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 9562 variant

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
