import { formatDistanceToNowStrict } from "date-fns";

// Rows dated by the database can be a moment ahead of the server's clock, which date-fns would
// print as "in 0 seconds".
export function timeAgo(date: string) {
  const time = new Date(date);
  return Date.now() - time.getTime() < 60_000
    ? "just now"
    : formatDistanceToNowStrict(time, { addSuffix: true });
}
