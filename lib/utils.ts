import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type {EnumType} from "@/types/generic";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function enumValues<T extends string>(input: EnumType<T>): readonly T[] {
    return Array.isArray(input) ? input : (Object.values(input) as T[]);
}

export function asEnum<T extends string>(val: string | undefined, allowed: readonly T[]): T | null {
    return val && (allowed as readonly string[]).includes(val) ? (val as T) : null;
}