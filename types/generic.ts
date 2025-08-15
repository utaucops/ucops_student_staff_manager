export type EnumType<T extends string> = readonly T[] | Record<string, T>;
export const NONE = "__NONE__";