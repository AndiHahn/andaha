export interface CreateWorkingEntryDto {
  personId: string,
  from: Date,
  until: Date,
  break: Date,
  notes?: string
}
