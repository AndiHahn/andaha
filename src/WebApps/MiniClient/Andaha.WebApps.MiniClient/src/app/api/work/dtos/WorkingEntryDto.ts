export interface WorkingEntryDto extends WorkingEntryDtoBase {
  from: Date,
  until: Date,
  break: Date,
}

export interface WorkingEntryDtoRaw extends WorkingEntryDtoBase {
  from: string,
  until: string,
  break: string,
}

interface WorkingEntryDtoBase {
  notes?: string
}

export function mapWorkingEntryDtoRaw(raw: WorkingEntryDtoRaw): WorkingEntryDto {
  return {
    ...raw,
    from: new Date(raw.from),
    until: new Date(raw.until),
    break: new Date(raw.break)
  }
}

export function mapWorkingEntryDtoRawList(raw: WorkingEntryDtoRaw[]): WorkingEntryDto[] {
  return raw.map(rawEntry => mapWorkingEntryDtoRaw(rawEntry));
}
