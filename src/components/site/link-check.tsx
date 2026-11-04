import { format } from "date-fns";
import type { Enums } from "@/types/database";

export function LinkCheck({
  status,
  checkedAt,
}: {
  status: Enums<"link_status">;
  checkedAt: string | null;
}) {
  if (status === "broken") {
    return <span className="text-destructive">It didn&apos;t respond at our last check.</span>;
  }
  if (status === "ok" && checkedAt) {
    return <>Link checked {format(new Date(checkedAt), "d MMM yyyy")}.</>;
  }
  return null;
}
