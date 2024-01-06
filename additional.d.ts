type Prettify<T> = {
  [K in keyof T]: T[K]
} & unknown

/**
 * ! ***probably a performance hazard!***
 * * use `Prettify<T>` when possible.
 */
type DeepPrettify<T> =
  // eslint-disable-next-line @typescript-eslint/ban-types
  T extends Function
    ? T
    : {
        [K in keyof T]: DeepPrettify<T[K]>
      } & unknown

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]
