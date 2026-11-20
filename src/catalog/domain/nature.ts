export const Nature = {
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO',
} as const;

export type Nature = (typeof Nature)[keyof typeof Nature];

const NATURES: readonly string[] = Object.values(Nature);

export function isNature(value: unknown): value is Nature {
  return typeof value === 'string' && NATURES.includes(value);
}
