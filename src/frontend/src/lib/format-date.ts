export function formatFrenchDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

/** Keep the calendar day supplied by the API, regardless of the browser time zone. */
export function formatFrenchCalendarDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Turn a date input value into the instant that Express stores for this calendar day.
 * @param day - A `YYYY-MM-DD` value from a date input.
 * @returns UTC midnight of this day, read back by `formatFrenchCalendarDate`.
 */
export function toCalendarDateTime(day: string): string {
  return `${day}T00:00:00.000Z`;
}
