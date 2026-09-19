"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Category, ThreadSummary } from "@/types/thread";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
  Hash,
  HelpCircle,
  LifeBuoy,
  MessagesSquare,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_STYLES: Record<
  string,
  { icon: ComponentType<{ className?: string }>; color: string }
> = {
  general: { icon: MessagesSquare, color: "text-chart-2" },
  "q-and-a": { icon: HelpCircle, color: "text-chart-3" },
  showcase: { icon: Sparkles, color: "text-chart-1" },
  help: { icon: LifeBuoy, color: "text-chart-4" },
};

function getCategoryStyle(slug: string) {
  return CATEGORY_STYLES[slug] ?? { icon: Hash, color: "text-muted-foreground" };
}

function ThreadCardSkeleton() {
  return (
    <Card className="border-border/70 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function ThreadsHomePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "all",
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);

        const [extractCategories, extractThreads] = await Promise.all([
          apiGet<Category[]>(apiClient, "/api/threads/categories"),
          apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads", {
            params: {
              category:
                activeCategory && activeCategory !== "all"
                  ? activeCategory
                  : undefined,
              q: search || undefined,
            },
          }),
        ]);

        if (!isMounted) return;

        setCategories(extractCategories);
        setThreads(extractThreads);
      } catch (error) {
        toast.error("Failed to load threads", {
          description: "Please refresh the page to try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [apiClient]);

  async function applyFilters(
    currentCategoryVal: string,
    currentSearchVal: string,
  ) {
    const params = new URLSearchParams();

    if (currentCategoryVal && currentCategoryVal !== "all") {
      params.set("category", currentCategoryVal);
    }

    if (currentSearchVal.trim()) {
      params.set("q", currentSearchVal.trim());
    }

    router.push(`?${params.toString()}`);

    setIsLoading(true);

    try {
      const threadsListAfterSearchAndFilter = await apiGet<ThreadSummary[]>(
        apiClient,
        "/api/threads/threads",
        {
          params: {
            category:
              currentCategoryVal && currentCategoryVal !== "all"
                ? currentCategoryVal
                : undefined,
            q: currentSearchVal || undefined,
          },
        },
      );

      setThreads(threadsListAfterSearchAndFilter);
    } catch (err) {
      toast.error("Failed to filter threads", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const activeCategoryLabel =
    activeCategory === "all"
      ? "All categories"
      : categories.find((c) => c.slug === activeCategory)?.name;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Latest threads
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse what the community is talking about, or start your own.
          </p>
        </div>

        <Link href="/threads/new" className="w-full sm:w-auto">
          <Button className="w-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90 sm:w-auto">
            <Plus className="h-4 w-4" />
            New Thread
          </Button>
        </Link>
      </div>

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-64">
          <Card className="sticky top-24 border-border/70 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => {
                  setActiveCategory("all");
                  applyFilters("all", search);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeCategory === "all"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Hash className="h-4 w-4" />
                All categories
              </button>
              {categories.map((cat) => {
                const { icon: Icon, color } = getCategoryStyle(cat.slug);
                const isActive = activeCategory === cat.slug;

                return (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      setActiveCategory(cat.slug);
                      applyFilters(cat.slug, search);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", !isActive && color)} />
                    {cat.name}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-card pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                placeholder="Search threads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyFilters(activeCategory, search);
                  }
                }}
              />
            </div>
            <Button
              variant="outline"
              className="border-border/70 bg-card hover:bg-secondary/60"
              onClick={() => applyFilters(activeCategory, search)}
            >
              Search
            </Button>
          </div>

          {activeCategoryLabel && activeCategoryLabel !== "All categories" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              Filtering by
              <Badge className="border-primary/30 bg-primary/10 text-primary">
                {activeCategoryLabel}
              </Badge>
            </div>
          )}

          <div className="space-y-3">
            {isLoading && (
              <>
                <ThreadCardSkeleton />
                <ThreadCardSkeleton />
                <ThreadCardSkeleton />
              </>
            )}

            {!isLoading && threads.length === 0 && (
              <Card className="border-dashed border-border bg-card">
                <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <MessagesSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No threads found
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Be the first to start a conversation here.
                    </p>
                  </div>
                  <Link href="/threads/new">
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4" />
                      New Thread
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {!isLoading &&
              threads.map((thread) => {
                const { icon: Icon, color } = getCategoryStyle(
                  thread.category.slug,
                );
                const authorLabel =
                  thread.author?.handle ?? thread.author?.displayName ?? null;

                return (
                  <Link key={thread.id} href={`/threads/${thread.id}`}>
                    <Card className="group cursor-pointer border-border/70 bg-card transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md hover:shadow-primary/5">
                      <CardContent className="flex items-start gap-4 py-4">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60",
                            color,
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="border-border/70 bg-secondary/70 text-[11px]"
                            >
                              {thread.category.name}
                            </Badge>
                            <span className="text-muted-foreground/85">
                              {new Date(thread.createdAt).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </div>

                          <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary md:text-lg">
                            {thread.title}
                          </CardTitle>

                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {thread.excerpt}
                          </p>

                          {authorLabel && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <Avatar size="sm">
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                  {getInitials(authorLabel)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">
                                {thread.author?.handle
                                  ? `@${thread.author.handle}`
                                  : authorLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreadsHomePage;
