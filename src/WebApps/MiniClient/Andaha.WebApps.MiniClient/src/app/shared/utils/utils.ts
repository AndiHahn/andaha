import * as moment from "moment";

export function getRecordOfProperties<T extends object>(object: T): Record<string, any> {
  const record: Record<string, any> = {};

  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Date) {
      record[key] = moment(new Date(value)).utc(false).toISOString();
    } else {
      record[key] = value;
    }
  }
  
  return record;
}
