
import { format } from 'date-fns';

export const START_HOUR = 8;
export const END_HOUR = 20;
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const PIXELS_PER_HOUR = 60;
export const hourLabels = Array.from({ length: 12 }, (_, i) => i + START_HOUR);

// Enhanced time formatter with AM/PM
export const formatTime = (time: number) => {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  const period = hours >= 12 ? "PM" : "AM"; // Uppercase AM/PM format
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Format a time string (HH:MM) to a time with AM/PM
export const formatTimeString = (timeString: string) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Convert a time with AM/PM to 24-hour format string (HH:MM)
export const to24HourFormat = (timeWithPeriod: string) => {
  if (!timeWithPeriod) return "";
  const [timePart, period] = timeWithPeriod.split(" ");
  const [hours, minutes] = timePart.split(":").map(Number);
  
  let hour = hours;
  if (period?.toUpperCase() === "PM" && hours < 12) {
    hour = hours + 12;
  } else if (period?.toUpperCase() === "AM" && hours === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export const formatDateTime = (date: Date, time: string) => {
  return `${format(date, 'yyyy-MM-dd')} ${time}`;
};

export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};
