import { Time } from "@angular/common";
import { WorkingEntryDto } from "src/app/api/work/dtos/WorkingEntryDto";

export interface WorkingTime {
  from: Date;
  until: Date;
  break: Time;
}

export function createTimeDisplayName(time: Time): string {
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
  timeString += " h";

  return timeString;
}

export function getTotalWorkingTimeString(workingTime: WorkingTime): string {
  const dateDiff = calculateDateDifference(workingTime.from, workingTime.until);
  
  var calculatedWorkingTime: Time = {
    hours: dateDiff.hours,
    minutes: dateDiff.minutes
  }

  if (calculatedWorkingTime.minutes - workingTime.break.minutes >= 0) {
    calculatedWorkingTime.minutes -= workingTime.break.minutes;
    calculatedWorkingTime.hours -= workingTime.break.hours;
  } else {
    calculatedWorkingTime.minutes = 60 - (workingTime.break.minutes - calculatedWorkingTime.minutes);
    calculatedWorkingTime.hours -= (workingTime.break.hours + 1);
  }

  return createTimeDisplayName(calculatedWorkingTime);
}

export function calculateDateDifference(startDate: Date, endDate: Date) {
  var diff = endDate.getTime() - startDate.getTime();
  var days = Math.floor(diff / (60 * 60 * 24 * 1000));
  var hours = Math.floor(diff / (60 * 60 * 1000)) - (days * 24);
  var minutes = Math.floor(diff / (60 * 1000)) - ((days * 24 * 60) + (hours * 60));
  var seconds = Math.floor(diff / 1000) - ((days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60));

  return {
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds
  };
}

export function calculateTimeDifference(left: Time, right: Time) : Time {
  var time: Time = { hours: 0, minutes: 0};

  if (left.minutes - right.minutes >= 0) {
    time.minutes = left.minutes - right.minutes;
    time.hours = left.hours - right.hours;
  } else {
    time.minutes = 60 - (right.minutes - left.minutes);
    time.hours = left.hours - (right.hours + 1);
  }

  return time;
}

export function addTimes(left: Time, right: Time) : Time {
  var time: Time = { hours: 0, minutes: 0};

  if (left.minutes + right.minutes < 60) {
    time.minutes = left.minutes + right.minutes;
    time.hours = left.hours + right.hours;
  } else {
    time.minutes = (right.minutes + left.minutes) - 60;
    time.hours = left.hours + right.hours + 1;
  }

  return time;
}