export async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise
  } catch (error) {
    console.error(error)
    return []
  }
}
