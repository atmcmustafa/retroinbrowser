import type { Metadata } from "next";
import { PopularList, popularMetadata } from "@/components/site/paged-lists";

export const metadata: Metadata = popularMetadata(1);

export default function PopularPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <PopularList page={1} />
    </div>
  );
}
