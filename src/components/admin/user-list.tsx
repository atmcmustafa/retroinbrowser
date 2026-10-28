"use client";

import {
  BanIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UndoIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/site/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  banUser,
  deleteUser,
  renameUser,
  unbanUser,
  type UserActionResult,
} from "@/lib/actions/users";

export type ListedUser = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  isAdmin: boolean;
  isMe: boolean;
  banned: boolean;
  authBanned: boolean;
  banReason: string | null;
  comments: number;
  providers: string[];
  joined: string;
  lastSeen: string | null;
};

type Open = { kind: "rename" | "ban" | "delete"; user: ListedUser } | null;

const providerNames: Record<string, string> = {
  email: "Email",
  google: "Google",
  discord: "Discord",
  github: "GitHub",
};

export function UserList({ users }: { users: ListedUser[] }) {
  const [open, setOpen] = useState<Open>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<UserActionResult>, done: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(done);
      setOpen(null);
    });
  }

  return (
    <>
      <ul className="mt-6 divide-y rounded-lg border">
        {users.map((user) => (
          <li key={user.id} className="flex items-start gap-3 p-4">
            <UserAvatar name={user.name} src={null} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold break-words">{user.name}</span>
                {user.isMe && <Badge variant="outline">You</Badge>}
                {user.isAdmin && (
                  <Badge variant="outline">
                    <ShieldCheckIcon />
                    Admin
                  </Badge>
                )}
                {user.banned && (
                  <Badge variant="destructive">
                    {user.authBanned ? "Banned" : "Banned on the site only"}
                  </Badge>
                )}
              </p>
              {user.email && <p className="mt-0.5 truncate text-muted-foreground">{user.email}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Joined {user.joined}
                {user.lastSeen && ` · last sign-in ${user.lastSeen}`}
                {user.providers.length > 0 &&
                  ` · ${user.providers.map((p) => providerNames[p] ?? p).join(", ")}`}
                {" · "}
                <Link
                  href={`/admin/comments?user=${user.id}`}
                  className="rounded-sm underline-offset-2 hover:text-foreground hover:underline"
                >
                  {user.comments} {user.comments === 1 ? "comment" : "comments"}
                </Link>
              </p>
              {user.banned && user.banReason && (
                <p className="mt-1 text-xs break-words text-destructive">{user.banReason}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${user.name}`}
                  disabled={pending}
                >
                  <MoreHorizontalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => setOpen({ kind: "rename", user })}>
                  <PencilIcon />
                  Change username
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/comments?user=${user.id}`}>
                    <MessageSquareIcon />
                    View comments
                  </Link>
                </DropdownMenuItem>
                {!user.isAdmin && !user.isMe && (
                  <>
                    <DropdownMenuSeparator />
                    {/* A ban whose Auth step failed can be run again. */}
                    {(!user.banned || !user.authBanned) && (
                      <DropdownMenuItem onSelect={() => setOpen({ kind: "ban", user })}>
                        <BanIcon />
                        {user.banned ? "Finish ban" : "Ban"}
                      </DropdownMenuItem>
                    )}
                    {user.banned && (
                      <DropdownMenuItem
                        onSelect={() =>
                          run(() => unbanUser(user.id), `Lifted the ban on ${user.name}.`)
                        }
                      >
                        <UndoIcon />
                        Lift ban
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setOpen({ kind: "delete", user })}
                    >
                      <Trash2Icon />
                      Delete account
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent>
          {open?.kind === "rename" && (
            <RenameForm
              key={open.user.id}
              user={open.user}
              pending={pending}
              onSubmit={(username) =>
                run(() => renameUser(open.user.id, username), `Renamed to ${username}.`)
              }
            />
          )}
          {open?.kind === "ban" && (
            <BanForm
              key={open.user.id}
              user={open.user}
              pending={pending}
              onSubmit={(reason, deleteComments) =>
                run(
                  () => banUser({ id: open.user.id, reason, deleteComments }),
                  `Banned ${open.user.name}.`,
                )
              }
            />
          )}
          {open?.kind === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {open.user.name}&apos;s account?</DialogTitle>
                <DialogDescription>
                  This removes the account with its comments, favorites and play history. It
                  can&apos;t be undone, and they can sign up again with the same email: to keep
                  someone out, ban them instead.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    run(() => deleteUser(open.user.id), `Deleted ${open.user.name}'s account.`)
                  }
                >
                  {pending ? "Deleting…" : "Delete account"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RenameForm({
  user,
  pending,
  onSubmit,
}: {
  user: ListedUser;
  pending: boolean;
  onSubmit: (username: string) => void;
}) {
  const [username, setUsername] = useState(user.username ?? "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(username);
      }}
      className="flex flex-col gap-6"
    >
      <DialogHeader>
        <DialogTitle>Change username</DialogTitle>
        <DialogDescription>
          Their comments switch to the new name too, shortened like any name with a space.
        </DialogDescription>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="rename-username">Username</FieldLabel>
        <Input
          id="rename-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          maxLength={32}
          autoComplete="off"
          required
        />
        <FieldDescription>Up to 32 characters, unique.</FieldDescription>
      </Field>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending || !username.trim()}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BanForm({
  user,
  pending,
  onSubmit,
}: {
  user: ListedUser;
  pending: boolean;
  onSubmit: (reason: string, deleteComments: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [deleteComments, setDeleteComments] = useState(user.comments > 0);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(reason, deleteComments);
      }}
      className="flex flex-col gap-6"
    >
      <DialogHeader>
        <DialogTitle>Ban {user.name}?</DialogTitle>
        <DialogDescription>
          They&apos;re signed out at once and can&apos;t sign in again until you lift the ban.
        </DialogDescription>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="ban-reason">Reason</FieldLabel>
        <Input
          id="ban-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          placeholder="Spam, insults…"
          autoComplete="off"
        />
        <FieldDescription>For your notes; not shown on the site. Optional.</FieldDescription>
      </Field>
      {user.comments > 0 && (
        <Field orientation="horizontal">
          <Checkbox
            id="ban-delete-comments"
            checked={deleteComments}
            onCheckedChange={(checked) => setDeleteComments(checked === true)}
          />
          <FieldLabel htmlFor="ban-delete-comments" className="font-normal">
            Also delete their {user.comments} {user.comments === 1 ? "comment" : "comments"}
          </FieldLabel>
        </Field>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Banning…" : "Ban"}
        </Button>
      </DialogFooter>
    </form>
  );
}
