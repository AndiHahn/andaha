import { HttpParams } from "@angular/common/http";
import { HttpParam } from "../common-dtos/HttpParam";
import { Time } from "@angular/common";

export function createHttpParameters(params: HttpParam[]): HttpParams {
  let httpParameters = new HttpParams();
  
  params.forEach(param => httpParameters = httpParameters.append(param.key, param.value));

  return httpParameters;
}

export function generateGuid() : string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatTime(time: Time): string {

  var timeString = "";
  if (time.hours < 10) {
    timeString = "0";
  }

  timeString += time.hours;
  timeString += ":";

  if (time.minutes < 10) {
    timeString += "0";
  }

  timeString += time.minutes;
  timeString += ":00";

  return timeString;
}

export function getHoursFromTimeString(time: string): number {
  const timeTokens = time.split(":");
  return Number(timeTokens[0]);
}

export function getMinutesFromTimeString(time: string): number {
  const timeTokens = time.split(":");
  return Number(timeTokens[1]);
}
