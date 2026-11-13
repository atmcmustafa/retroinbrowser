import type { Metadata } from "next";
import { NewList, newMetadata } from "@/components/site/paged-lists";

export const metadata: Metadata = newMetadata(1);

export default function NewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <NewList page={1} />
    </div>
  );
}
