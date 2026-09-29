import { describe, expect, it } from "vitest"
import { safeList } from "./safe-list"

describe("safeList", () => {
  it("resolves to the array when the promise succeeds", async () => {
    await expect(safeList(Promise.resolve([1, 2, 3]))).resolves.toEqual([1, 2, 3])
  })

  it("resolves to an empty array when the promise rejects", async () => {
    await expect(safeList(Promise.reject(new Error("database is down")))).resolves.toEqual([])
  })
})
