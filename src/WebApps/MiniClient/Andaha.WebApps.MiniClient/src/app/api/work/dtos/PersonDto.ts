import { WorkingEntryDto } from "./WorkingEntryDto";

export interface PersonDto extends PersonDtoBase {
  lastPayed: Date;
}

export interface PersonDtoRaw extends PersonDtoBase {
  lastPayed: string;
}

interface PersonDtoBase {
  id: string,
  name: string,
  hourlyRate: number,
  payedHours: number,
  notes?: string,
  workingEntries: WorkingEntryDto[]
}

export function mapPersonDtoRaw(raw: PersonDtoRaw): PersonDto {
  return {
    ...raw,
    lastPayed: new Date(raw.lastPayed)
  }
}

export function mapPersonDtoRawList(raw: PersonDtoRaw[]): PersonDto[] {
  return raw.map(rawEntry => mapPersonDtoRaw(rawEntry));
}
