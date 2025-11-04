import { Result, ok, err, ResultAsync, fromPromise, fromThrowable } from 'neverthrow'

export { Result, ok, err, ResultAsync, fromPromise, fromThrowable }

// Helper type for async operations
export type AsyncResult<T, E> = ResultAsync<T, E>

// Helper to convert promises to Results
export const asyncResult = <T, E = Error>(
  promise: Promise<T>,
  errorFn?: (error: unknown) => E
): AsyncResult<T, E> => {
  return ResultAsync.fromPromise(
    promise,
    errorFn || ((e: unknown) => (e instanceof Error ? e : new Error(String(e))) as E)
  )
}
