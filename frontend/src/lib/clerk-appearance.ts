import type { Appearance } from "@clerk/types";

export const clerkDarkAppearance: Appearance = {
  variables: {
    colorPrimary: "#bef264",
    colorBackground: "#111322",
    colorInputBackground: "#020617",
    colorInputText: "#e5e7eb",
    colorText: "#e5e7eb",
    colorTextSecondary: "#9ca3af",
    colorNeutral: "#e5e7eb",
    colorDanger: "#ef4444",
    borderRadius: "0.625rem",
  },
  elements: {
    card: "shadow-none border border-border/70",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButton: "border-border/70",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    formFieldLabel: "text-foreground",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary",
  },
};
