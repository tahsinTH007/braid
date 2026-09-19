"use client";

import DirectChatPanel from "@/components/chat/direct-chat-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/use-socket";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { cn, getInitials } from "@/lib/utils";
import { ChatUser } from "@/types/chat";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function UserListSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Chat() {
  const { getToken } = useAuth();
  const { connected, socket } = useSocket();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoadingUsers(true);

      try {
        const res = await apiGet<ChatUser[]>(apiClient, "/api/chat/users");

        if (!isMounted) return;
        const finalRes = res.map((row) => ({
          id: Number(row.id),
          displayName: row.displayName ?? null,
          handle: row.handle ?? null,
          avatarUrl: row.avatarUrl ?? null,
        }));
        setUsers(finalRes);

        if (res.length > 0 && activeUserId === null) {
          setActiveUserId(res[0].id);
        }
      } catch (err) {
        toast.error("Failed to load users", {
          description: "Please refresh the page to try again.",
        });
      } finally {
        setLoadingUsers(false);
      }
    }
    load();

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  useEffect(() => {
    if (!socket) return;

    function handlePresense(payload: { onlineUserIds?: number[] }) {
      const list = payload?.onlineUserIds ?? [];
      setOnlineUserIds(list);
    }

    socket.on("presence:update", handlePresense);

    return () => {
      socket.off("presence:update", handlePresense);
    };
  }, [socket]);

  const activeUser =
    activeUserId !== null
      ? (users.find((u) => u.id === activeUserId) ?? null)
      : null;

  const onlineCount = users.filter((u) => onlineUserIds.includes(u.id)).length;

  const filteredUsers = users
    .filter((user) => {
      const query = userSearch.trim().toLowerCase();
      if (!query) return true;

      return (
        user.handle?.toLowerCase().includes(query) ||
        user.displayName?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aOnline = onlineUserIds.includes(a.id) ? 1 : 0;
      const bOnline = onlineUserIds.includes(b.id) ? 1 : 0;
      return bOnline - aOnline;
    });

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-6xl gap-6 py-6">
      <aside
        className={cn(
          "w-full shrink-0 md:block md:w-72",
          showListOnMobile ? "block" : "hidden",
        )}
      >
        <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-card py-4">
          <CardHeader className="shrink-0 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm text-foreground">
                Direct Messages
              </CardTitle>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {onlineCount} online &middot; {users.length} total
            </p>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search people..."
                className="h-8 bg-background/60 pl-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-1 overflow-y-auto px-2">
            {loadingUsers && <UserListSkeleton />}

            {!loadingUsers && filteredUsers.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                No people match &ldquo;{userSearch}&rdquo;
              </p>
            )}

            {!loadingUsers &&
              filteredUsers.map((user) => {
                const isOnline = onlineUserIds.includes(user.id);
                const isActive = activeUserId === user.id;

                const label =
                  user.handle && user.handle !== ""
                    ? `@${user.handle}`
                    : (user.displayName ?? "User");

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setActiveUserId(user.id);
                      setShowListOnMobile(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs transition-colors duration-150",
                      isActive
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : "text-muted-foreground hover:bg-secondary/60",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-8 w-8">
                        {user.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt={label} />
                        )}
                        <AvatarFallback className="bg-secondary text-[11px] text-foreground">
                          {getInitials(user.handle || user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                          isOnline ? "bg-primary" : "bg-muted-foreground/50",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex flex-1 flex-col">
                      <span className="truncate text-[12px] font-medium text-foreground">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "text-[12px]",
                          isOnline ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </button>
                );
              })}
          </CardContent>
        </Card>
      </aside>

      <main
        className={cn(
          "min-h-0 flex-1",
          showListOnMobile ? "hidden md:flex" : "flex",
        )}
      >
        {activeUserId && activeUser ? (
          <DirectChatPanel
            otherUserId={activeUserId}
            otherUser={activeUser}
            socket={socket}
            connected={connected}
            onBack={() => setShowListOnMobile(true)}
          />
        ) : (
          <Card className="flex h-full w-full items-center justify-center border-border/70 bg-card">
            <CardContent className="text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-55" />
              <p className="text-sm text-muted-foreground">
                Select a user to start chatting...
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default Chat;
