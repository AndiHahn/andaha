export interface PersonDto extends PersonDtoBase {
  lastPayed: Date,
  totalHours: string,
  payedHours: string
}

export interface PersonDtoRaw extends PersonDtoBase {
  lastPayed: string,
  totalHours: string,
  payedHours: string
}

interface PersonDtoBase {
  id: string,
  name: string,
  hourlyRate: number,
  notes?: string,
}

export function mapPersonDtoRaw(raw: PersonDtoRaw): PersonDto {
  return {
    ...raw,
    lastPayed: new Date(raw.lastPayed),
    //totalHours: new Date(raw.totalHours),
    //payedHours: new Date(raw.payedHours)
  }
}

export function mapPersonDtoRawList(raw: PersonDtoRaw[]): PersonDto[] {
  return raw.map(rawEntry => mapPersonDtoRaw(rawEntry));
}
