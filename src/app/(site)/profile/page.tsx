import type { Metadata } from "next";
import { ProfileView } from "@/components/site/profile-view";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <ProfileView />
    </div>
  );
}
