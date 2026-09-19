"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import {
  ChatUser,
  DirectMessage,
  mapDirectMessage,
  mapDirectMessagesResponse,
  RawDirectMessage,
} from "@/types/chat";
import { useAuth } from "@clerk/nextjs";
import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Socket } from "socket.io-client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, MessageSquare, Send, Wifi, WifiOff } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import ImageUploadButton from "./image-upload-button";
import { getInitials } from "@/lib/utils";

type DirectChatPanelProps = {
  otherUserId: number;
  otherUser: ChatUser | null;
  socket: Socket | null;
  connected: boolean;
  onBack?: () => void;
};

function DirectChatPanel(props: DirectChatPanelProps) {
  const { otherUser, otherUserId, socket, connected, onBack } = props;
  const { getToken } = useAuth();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const res = await apiGet<DirectMessage[]>(
          apiClient,
          `/api/chat/conversations/${otherUserId}/messages`,
          {
            params: {
              limit: 100,
            },
          }
        );

        if (!isMounted) return;
        setMessages(mapDirectMessagesResponse(res));
      } catch (err) {
        toast.error("Failed to load messages", {
          description: "Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (otherUserId) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [apiClient, otherUserId]);

  useEffect(() => {
    if (!socket) return;

    function handleMessage(payload: RawDirectMessage) {
      const mapped = mapDirectMessage(payload);

      if (
        mapped.senderUserId !== otherUserId &&
        mapped.recipientUserId !== otherUserId
      ) {
        return;
      }

      setMessages((prev) => [...prev, mapped]);
    }

    function handleTyping(payload: {
      senderUserId?: number;
      receipientUserId?: number;
      isTyping?: boolean;
    }) {
      const senderId = Number(payload.senderUserId);

      if (senderId !== otherUserId) return;

      if (payload.isTyping) {
        setTypingLabel("Typing...");
      } else {
        setTypingLabel(null);
      }
    }

    socket.on("dm:message", handleMessage);
    socket.on("dm:typing", handleTyping);

    return () => {
      socket.off("dm:message", handleMessage);
      socket.off("dm:typing", handleTyping);
    };
  }, [socket, otherUserId]);

  function setSendTyping(isTyping: boolean) {
    if (!socket) {
      return;
    }

    socket.emit("dm:typing", { recipientUserId: otherUserId, isTyping });
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;

    setInput(value);

    if (!socket) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSendTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setSendTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  async function handleSend() {
    if (!socket || !connected) {
      toast("Not connected", {
        description: "Realtime connection is not established yet!",
      });

      return;
    }

    const body = input.trim();

    if (!body && !imageUrl) return;

    setSending(true);

    try {
      socket.emit("dm:send", {
        recipientUserId: otherUserId,
        body: body || null,
        imageUrl: imageUrl || null,
      });

      setInput("");
      setImageUrl(null);
      setSendTyping(false);
    } finally {
      setSending(false);
    }
  }

  const title =
    otherUser?.handle && otherUser?.handle !== ""
      ? `@${otherUser?.handle}`
      : otherUser?.displayName ?? "Conversation";

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden border-border/70 bg-card py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBack && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={onBack}
              className="-ml-1 shrink-0 text-muted-foreground md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9 shrink-0">
            {otherUser?.avatarUrl && (
              <AvatarImage src={otherUser.avatarUrl} alt={title} />
            )}
            <AvatarFallback className="bg-secondary text-xs text-foreground">
              {getInitials(otherUser?.handle || otherUser?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-base text-foreground">
              {title}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Direct message conversation
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium ${
              connected
                ? "bg-primary/10 text-primary"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {connected ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto bg-background/60 p-4">
        {isLoading && (
          <div className="space-y-3">
            <div className="flex justify-start">
              <div className="h-10 w-40 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-32 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="flex justify-start">
              <div className="h-10 w-48 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              No messages yet. Send the first one.
            </p>
          </div>
        )}

        {!isLoading &&
          messages.map((msg) => {
            const isOther = msg.senderUserId === otherUserId;
            const label = isOther ? title : "You";

            const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                className={`flex items-end gap-2 text-xs ${
                  isOther ? "justify-start" : "justify-end"
                }`}
                key={msg.id}
              >
                {isOther && (
                  <Avatar className="h-6 w-6 shrink-0">
                    {otherUser?.avatarUrl && (
                      <AvatarImage src={otherUser.avatarUrl} alt={title} />
                    )}
                    <AvatarFallback className="bg-secondary text-[9px] text-foreground">
                      {getInitials(otherUser?.handle || otherUser?.displayName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-xs ${isOther ? "" : "order-2"}`}>
                  <div
                    className={`mb-1 text-[12px] font-medium ${
                      isOther
                        ? "text-muted-foreground"
                        : "text-right text-muted-foreground"
                    }`}
                  >
                    {label} &middot; {time}
                  </div>

                  {msg?.body && (
                    <div
                      className={`inline-block rounded-2xl px-3.5 py-2 shadow-sm transition-colors duration-150
                      ${
                        isOther
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground"
                      }
                      `}
                    >
                      <p className="wrap-break-word text-sm leading-relaxed">
                        {msg.body}
                      </p>
                    </div>
                  )}

                  {msg?.imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-border">
                      <img
                        src={msg.imageUrl}
                        alt="attachment"
                        className="max-h-52 max-w-xs rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {typingLabel && (
          <div className="flex justify-start gap-2 text-xs">
            <div className="italic text-muted-foreground">{typingLabel}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="space-y-3 border-t border-border bg-card p-5">
        {imageUrl && (
          <div className="rounded-lg border border-border bg-background/70 p-2">
            <p className="text-[12px] text-muted-foreground mb-2">
              Image ready to send:
            </p>
            <img
              src={imageUrl}
              alt="pending"
              className="max-h-32 rounded-lg border border-border object-contain"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* image upload component  */}
            <ImageUploadButton onImageUpload={(url) => setImageUrl(url)} />
            <span className="text-[11px] text-muted-foreground">
              Attach an image
            </span>
          </div>

          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={!connected || sending}
              className="min-h-14 resize-none border-border bg-background text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || !connected || (!input.trim() && !imageUrl)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default DirectChatPanel;
