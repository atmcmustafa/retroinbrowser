import { format } from "date-fns";
import type { Metadata } from "next";
import { AdminSearch } from "@/components/admin/admin-search";
import { FilterTabs } from "@/components/admin/filter-tabs";
import { AdminPageHeader } from "@/components/admin/page-header";
import { UserList } from "@/components/admin/user-list";
import { Pagination } from "@/components/site/pagination";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_USERS_PER_PAGE, getAdminUsers } from "@/lib/data/admin";
import {
  loadAdminUsersParams,
  serializeAdminUsersParams,
  type AdminUsersFilters,
} from "@/lib/search-params";
import { timeAgo } from "@/lib/time-ago";

export const metadata: Metadata = { title: "Users" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const me = await requireAdmin();
  const filters = await loadAdminUsersParams(searchParams);
  const { users, total, counts } = await getAdminUsers(filters);
  const pages = Math.max(1, Math.ceil(total / ADMIN_USERS_PER_PAGE));
  const href = (changes: { [K in keyof AdminUsersFilters]?: AdminUsersFilters[K] | null }) =>
    `/admin/users${serializeAdminUsersParams({ ...filters, page: null, ...changes })}`;

  const tabs: { value: AdminUsersFilters["status"]; label: string; count: number }[] = [
    { value: null, label: "All", count: counts.all },
    { value: "banned", label: "Banned", count: counts.banned },
    { value: "admins", label: "Admins", count: counts.admins },
  ];

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Everyone with an account, newest first. Banned accounts can't sign in."
      />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearch label="Search users" placeholder="Email, username or name" />
        <FilterTabs
          label="Filter users"
          tabs={tabs.map(({ value, label, count }) => ({
            label,
            count,
            href: href({ status: value }),
            active: filters.status === value,
          }))}
        />
      </div>

      {users.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
          No users match.
        </p>
      ) : (
        // Dates are written here, so the browser doesn't render a different "ago" than the server.
        <UserList
          users={users.map((user) => ({
            id: user.id,
            name: user.username ?? user.fullName ?? user.email?.split("@")[0] ?? "Unnamed",
            username: user.username,
            email: user.email,
            isAdmin: user.role === "admin",
            isMe: user.id === me.id,
            banned: user.bannedAt !== null,
            authBanned: user.authBanned,
            banReason: user.banReason,
            comments: user.comments,
            providers: user.providers,
            joined: format(new Date(user.createdAt), "d MMM yyyy"),
            lastSeen: user.lastSignInAt ? timeAgo(user.lastSignInAt) : null,
          }))}
        />
      )}
      <Pagination
        page={Math.min(Math.max(1, filters.page), pages)}
        totalPages={pages}
        hrefFor={(page) => href({ page: page > 1 ? page : null })}
        className="mt-8"
      />
    </>
  );
}
