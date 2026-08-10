export const MATTER_WORK_STATUSES = [
  "Aktivan",
  "Čeka klijenta",
  "Čeka drugu stranu",
  "Čeka sud / organ",
  "U izradi",
  "Za finalizaciju",
  "Poslato",
  "Završeno",
  "Arhiva",
] as const;

export const MATTER_WORK_PRIORITIES = ["Nizak", "Srednji", "Visok", "Hitno"] as const;

export const MATTER_WORK_WAITING_OPTIONS = [
  "Niko / nije primenljivo",
  "Klijent",
  "Druga strana",
  "Sud / državni organ",
  "Interno",
  "Ostalo",
] as const;

export const MATTER_WORK_FIELD_KEYS = [
  "status",
  "priority",
  "nextStep",
  "waitingFor",
  "waitingDetail",
  "deadline",
] as const;

export type MatterWorkFieldKey = (typeof MATTER_WORK_FIELD_KEYS)[number];

export type MatterWorkValues = Record<MatterWorkFieldKey, string>;

export const EMPTY_MATTER_WORK_VALUES: MatterWorkValues = {
  status: "",
  priority: "",
  nextStep: "",
  waitingFor: "",
  waitingDetail: "",
  deadline: "",
};
