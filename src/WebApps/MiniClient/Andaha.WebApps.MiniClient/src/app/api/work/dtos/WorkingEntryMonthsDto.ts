import { WorkingEntryDto, WorkingEntryDtoRaw, mapWorkingEntryDtoRawList } from "./WorkingEntryDto";

/** Antwort von GET api/working-entry/{personId}/months */
export interface WorkingEntryMonthsDto {
  /** Einträge ganzer Monate, neueste zuerst */
  entries: WorkingEntryDto[];
  /** Monat ("yyyy-MM") für die nächste Seite, `null` wenn es keine älteren Monate gibt */
  nextUntil: string | null;
}

export interface WorkingEntryMonthsDtoRaw {
  entries: WorkingEntryDtoRaw[];
  nextUntil: string | null;
}

export function mapWorkingEntryMonthsDtoRaw(raw: WorkingEntryMonthsDtoRaw): WorkingEntryMonthsDto {
  return {
    entries: mapWorkingEntryDtoRawList(raw.entries),
    nextUntil: raw.nextUntil ?? null
  };
}
