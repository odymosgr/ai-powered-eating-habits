import { newId } from "./ids";

const noRandom = new Uint8Array(10);

test("makes a version 7 UUID", () => {
  expect(newId(Date.now(), noRandom)).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
});

test("starts with the time, so later IDs sort after earlier ones", () => {
  expect(newId(0x0123456789ab, noRandom).replaceAll("-", "").slice(0, 12)).toBe(
    "0123456789ab",
  );
  expect(newId(1000, noRandom) < newId(2000, noRandom)).toBe(true);
});

test("keeps the random bytes apart from the version and variant bits", () => {
  const allOnes = new Uint8Array(10).fill(0xff);

  expect(newId(0, allOnes)).toBe("00000000-0000-7fff-bfff-ffffffffffff");
});
