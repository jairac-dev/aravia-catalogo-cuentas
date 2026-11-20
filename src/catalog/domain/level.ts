export const Level = {
  CLASE: 'CLASE',
  GRUPO: 'GRUPO',
  CUENTA: 'CUENTA',
  SUBCUENTA: 'SUBCUENTA',
} as const;

export type Level = (typeof Level)[keyof typeof Level];

/** Longitud del código para cada nivel, de la raíz a la hoja. */
export const CODE_LENGTH_BY_LEVEL = {
  CLASE: 1,
  GRUPO: 2,
  CUENTA: 4,
  SUBCUENTA: 6,
} as const satisfies Record<Level, number>;

const LEVELS_IN_ORDER: readonly Level[] = [
  Level.CLASE,
  Level.GRUPO,
  Level.CUENTA,
  Level.SUBCUENTA,
];

/** Devuelve el nivel que corresponde a la longitud, o undefined si no es válida. */
export function levelForCodeLength(length: number): Level | undefined {
  return LEVELS_IN_ORDER.find(
    (level) => CODE_LENGTH_BY_LEVEL[level] === length,
  );
}

/** Nivel inmediatamente superior; undefined para CLASE. */
export function parentLevelOf(level: Level): Level | undefined {
  const index = LEVELS_IN_ORDER.indexOf(level);
  return index > 0 ? LEVELS_IN_ORDER[index - 1] : undefined;
}
