"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUploadButton from "@/components/chat/image-upload-button";
import { apiGet, apiPatch, createBrowserApiClient } from "@/lib/api-client";
import { cn, getInitials } from "@/lib/utils";
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Save, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const optionalText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const ProfileSchema = z.object({
  displayName: optionalText,
  handle: optionalText,
  bio: optionalText,
  avatarUrl: optionalText,
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

type UserResponse = {
  id: number;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

function ProfilePage() {
  const { getToken } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: "",
      handle: "",
      bio: "",
      avatarUrl: "",
    },
  });

  const {
    formState: { errors },
  } = form;

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsSaving(true);

      const payload: Record<string, string> = {};

      if (values.displayName) payload.displayName = values.displayName;
      if (values.handle) payload.handle = values.handle.toLowerCase();
      if (values.bio) payload.bio = values.bio;
      if (values.avatarUrl) payload.avatarUrl = values.avatarUrl;

      const apiResponse = await apiPatch<typeof payload, UserResponse>(
        apiClient,
        "/api/me",
        payload,
      );

      form.reset({
        displayName: apiResponse.displayName ?? "",
        handle: apiResponse.handle ?? "",
        bio: apiResponse.bio ?? "",
        avatarUrl: apiResponse.avatarUrl ?? "",
      });

      toast.success("profile updated successfully", {
        description: "Your changes have been saved successfully!",
      });
    } catch (e) {
      toast.error("Failed to update profile", {
        description: "Please check your input and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsLoading(true);

        const getUserInfo = await apiGet<UserResponse>(apiClient, "/api/me");

        if (!isMounted) {
          return;
        }

        setEmail(getUserInfo.email ?? null);

        form.reset({
          displayName: getUserInfo.displayName ?? "",
          handle: getUserInfo.handle ?? "",
          bio: getUserInfo.bio ?? "",
          avatarUrl: getUserInfo.avatarUrl ?? "",
        });
      } catch (err: any) {
        toast.error("Failed to load profile", {
          description: "Please refresh the page to try again.",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();
  }, [apiClient, form]);

  const displayNameValue = form.watch("displayName");
  const handleValue = form.watch("handle");
  const avatarUrlValue = form.watch("avatarUrl");

  return (
    <>
      <SignedOut>
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            You&apos;re signed out
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to view and edit your profile.
          </p>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              <User className="h-7 w-7 text-primary" />
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your public profile information
            </p>
          </div>

          <Card className="overflow-hidden border-border/70 bg-card p-0">
            <div className="h-20 bg-linear-to-r from-primary/40 via-chart-1/30 to-chart-3/30" />
            <CardContent className="relative px-6 pb-6">
              <Avatar className="-mt-10 h-20 w-20 border-4 border-card shadow-sm">
                {avatarUrlValue && (
                  <AvatarImage
                    src={avatarUrlValue}
                    alt={displayNameValue ?? ""}
                  />
                )}
                <AvatarFallback className="bg-secondary text-lg text-foreground">
                  {getInitials(displayNameValue || handleValue)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3">
                <CardTitle className="text-2xl text-foreground">
                  {displayNameValue || "Your display name"}
                </CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      handleValue
                        ? "bg-primary/10 text-primary"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    {handleValue ? `@${handleValue}` : "@handle"}
                  </span>
                  {email && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {email}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="displayName"
                      className="text-sm font-semibold text-foreground"
                    >
                      Display Name
                    </label>
                    <Input
                      id="displayName"
                      placeholder="John Doe"
                      {...form.register("displayName")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />

                    {errors.displayName && (
                      <p className="text-xs text-destructive">
                        {errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="handle"
                      className="text-sm font-semibold text-foreground"
                    >
                      Handle
                    </label>
                    <Input
                      id="handle"
                      placeholder="@john"
                      {...form.register("handle")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />

                    {errors.handle && (
                      <p className="text-xs text-destructive">
                        {errors.handle.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="bio"
                      className="text-sm font-semibold text-foreground"
                    >
                      Bio
                    </label>
                    <Textarea
                      id="bio"
                      placeholder="Tell about yourself!!!"
                      rows={4}
                      {...form.register("bio")}
                      disabled={isLoading || isSaving}
                      className="border-border mt-2 bg-background/60 text-sm"
                    />

                    {errors.bio && (
                      <p className="text-xs text-destructive">
                        {errors.bio.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="avatarUrl"
                    className="text-sm font-semibold text-foreground"
                  >
                    Avatar URL
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="avatarUrl"
                      placeholder="http://abc.com"
                      {...form.register("avatarUrl")}
                      disabled={isLoading || isSaving}
                      className="border-border bg-background/60 text-sm"
                    />
                    <ImageUploadButton
                      onImageUpload={(url) =>
                        form.setValue("avatarUrl", url, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a link, or upload an image.
                  </p>

                  {errors.avatarUrl && (
                    <p className="text-xs text-destructive">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                </div>

                <CardFooter className="p-0">
                  <Button
                    type="submit"
                    disabled={isLoading || isSaving}
                    className="min-w-37.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="mr-2 w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </SignedIn>
    </>
  );
}

export default ProfilePage;
