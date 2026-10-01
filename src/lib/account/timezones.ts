/**
 * Common IANA timezones for the account screen, Australia first.
 * The "Detect" button can add the browser's zone if it is not listed.
 */
export const TIMEZONE_GROUPS: { label: string; zones: { id: string; label: string }[] }[] = [
  {
    label: "Australia",
    zones: [
      { id: "Australia/Brisbane", label: "Brisbane, Gold Coast (AEST)" },
      { id: "Australia/Sydney", label: "Sydney, Canberra (AEST/AEDT)" },
      { id: "Australia/Melbourne", label: "Melbourne (AEST/AEDT)" },
      { id: "Australia/Hobart", label: "Hobart (AEST/AEDT)" },
      { id: "Australia/Adelaide", label: "Adelaide (ACST/ACDT)" },
      { id: "Australia/Darwin", label: "Darwin (ACST)" },
      { id: "Australia/Perth", label: "Perth (AWST)" },
    ],
  },
  {
    label: "New Zealand and Pacific",
    zones: [
      { id: "Pacific/Auckland", label: "Auckland, Wellington" },
      { id: "Pacific/Fiji", label: "Fiji" },
      { id: "Pacific/Honolulu", label: "Honolulu" },
    ],
  },
  {
    label: "Asia",
    zones: [
      { id: "Asia/Singapore", label: "Singapore" },
      { id: "Asia/Kuala_Lumpur", label: "Kuala Lumpur" },
      { id: "Asia/Jakarta", label: "Jakarta" },
      { id: "Asia/Bangkok", label: "Bangkok" },
      { id: "Asia/Manila", label: "Manila" },
      { id: "Asia/Hong_Kong", label: "Hong Kong" },
      { id: "Asia/Shanghai", label: "Shanghai, Beijing" },
      { id: "Asia/Tokyo", label: "Tokyo" },
      { id: "Asia/Seoul", label: "Seoul" },
      { id: "Asia/Kolkata", label: "India" },
      { id: "Asia/Dubai", label: "Dubai" },
    ],
  },
  {
    label: "Europe and Africa",
    zones: [
      { id: "Europe/London", label: "London, Dublin, Lisbon" },
      { id: "Europe/Paris", label: "Paris, Berlin, Rome, Madrid" },
      { id: "Europe/Amsterdam", label: "Amsterdam, Brussels" },
      { id: "Europe/Athens", label: "Athens, Helsinki, Kyiv" },
      { id: "Europe/Istanbul", label: "Istanbul" },
      { id: "Africa/Johannesburg", label: "Johannesburg" },
      { id: "Africa/Cairo", label: "Cairo" },
    ],
  },
  {
    label: "Americas",
    zones: [
      { id: "America/New_York", label: "New York, Toronto (Eastern)" },
      { id: "America/Chicago", label: "Chicago (Central)" },
      { id: "America/Denver", label: "Denver (Mountain)" },
      { id: "America/Los_Angeles", label: "Los Angeles, Vancouver (Pacific)" },
      { id: "America/Anchorage", label: "Anchorage" },
      { id: "America/Mexico_City", label: "Mexico City" },
      { id: "America/Sao_Paulo", label: "Sao Paulo" },
      { id: "America/Buenos_Aires", label: "Buenos Aires" },
    ],
  },
  {
    label: "Other",
    zones: [{ id: "UTC", label: "UTC" }],
  },
];

export const TIMEZONE_IDS = TIMEZONE_GROUPS.flatMap((g) => g.zones.map((z) => z.id));

/** True when the runtime accepts the zone id. */
export function isValidTimezone(id: string): boolean {
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: id });
    return true;
  } catch {
    return false;
  }
}
