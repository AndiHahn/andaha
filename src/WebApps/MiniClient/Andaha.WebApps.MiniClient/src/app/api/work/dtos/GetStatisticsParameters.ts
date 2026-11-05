export interface GetStatisticsParameters {
  startTimeUtc: string,
  endTimeUtc: string,
  /** Personen-IDs; leer heißt alle eigenen und verbundenen Personen */
  personFilter: string[]
}
