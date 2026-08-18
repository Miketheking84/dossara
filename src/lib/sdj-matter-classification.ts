export const MATTER_TYPES = [
  "Parnični spor",
  "Privredni spor",
  "Radni spor",
  "Upravni spor",
  "Izvršni postupak",
  "Vanparnični postupak",
  "Krivični postupak",
  "Prekršajni postupak",
  "Arbitraža",
  "Medijacija / mirenje",
  "Ugovorni predmet",
  "Pravna usklađenost",
  "Pravno savjetovanje",
  "Drugo",
] as const;

export type MatterType = (typeof MATTER_TYPES)[number];

export function isMatterType(value: string): value is MatterType {
  return MATTER_TYPES.includes(value as MatterType);
}
