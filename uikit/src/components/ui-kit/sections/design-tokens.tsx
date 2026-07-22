"use client"

import { useState } from "react"
import { Logo } from "@/components/logo"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"
import { cn } from "@/lib/utils"

const colorTokens = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "destructive", className: "bg-destructive" },
  { name: "card", className: "bg-card" },
  { name: "popover", className: "bg-popover" },
  { name: "input", className: "bg-input" },
  { name: "border", className: "bg-border" },
  { name: "ring", className: "bg-ring" },
  { name: "sidebar", className: "bg-sidebar" },
  { name: "sidebar-primary", className: "bg-sidebar-primary" },
  { name: "chart-1", className: "bg-chart-1" },
  { name: "chart-2", className: "bg-chart-2" },
  { name: "chart-3", className: "bg-chart-3" },
  { name: "chart-4", className: "bg-chart-4" },
  { name: "chart-5", className: "bg-chart-5" },
] as const

const radiusTokens = [
  { name: "sm", className: "rounded-sm" },
  { name: "md", className: "rounded-md" },
  { name: "lg", className: "rounded-lg" },
  { name: "xl", className: "rounded-xl" },
  { name: "2xl", className: "rounded-2xl" },
  { name: "3xl", className: "rounded-3xl" },
  { name: "4xl", className: "rounded-4xl" },
] as const

const spacingScale = [
  { name: "1", className: "gap-1", size: "4px" },
  { name: "2", className: "gap-2", size: "8px" },
  { name: "3", className: "gap-3", size: "12px" },
  { name: "4", className: "gap-4", size: "16px" },
  { name: "6", className: "gap-6", size: "24px" },
  { name: "8", className: "gap-8", size: "32px" },
  { name: "12", className: "gap-12", size: "48px" },
  { name: "16", className: "gap-16", size: "64px" },
] as const

const semanticSpacing = [
  {
    name: "space-inline",
    token: "--space-inline",
    usage: "Inline gaps, compact UI",
  },
  {
    name: "space-stack",
    token: "--space-stack",
    usage: "Vertical component stacks",
  },
  {
    name: "space-section",
    token: "--space-section",
    usage: "Section separation",
  },
  { name: "space-page", token: "--space-page", usage: "Page padding" },
] as const

const shadowTokens = [
  { name: "shadow-xs", label: "xs", usage: "Hero badge" },
  { name: "shadow-sm", label: "sm", usage: "Header, surfaces" },
  { name: "shadow-md", label: "md", usage: "Cards" },
  { name: "shadow-lg", label: "lg", usage: "Popovers, menus" },
  { name: "shadow-xl", label: "xl", usage: "Dialogs, drawers" },
] as const

const logoTokenSwatches = [
  { name: "logo-surface", var: "--logo-surface" },
  { name: "logo-mark-primary", var: "--logo-mark-primary" },
  { name: "logo-mark-secondary", var: "--logo-mark-secondary" },
  { name: "logo-mark-tertiary", var: "--logo-mark-tertiary" },
  { name: "logo-border", var: "--logo-border" },
] as const

const typographyScale = [
  {
    label: "Display",
    className: "text-display",
    token: "text-display · --type-display-*",
  },
  {
    label: "Title",
    className: "text-title",
    token: "text-title · --type-title-*",
  },
  {
    label: "Subtitle",
    className: "text-subtitle",
    token: "text-subtitle · --type-subtitle-*",
  },
  {
    label: "Lead",
    className: "text-lead text-muted-foreground",
    token: "text-lead · --type-lead-* (+ color utility)",
  },
  {
    label: "Body",
    className: "text-body",
    token: "text-body · --type-body-*",
  },
  {
    label: "Label",
    className: "text-label",
    token: "text-label · --type-label-*",
  },
  {
    label: "Caption",
    className: "text-caption",
    token: "text-caption · --type-caption-* (includes muted color)",
  },
  {
    label: "Mono",
    className: "text-mono",
    token: "text-mono · --type-mono-*",
  },
] as const

function MotionDemo({
  durationClass,
  easeClass,
  label,
}: {
  durationClass: string
  easeClass: string
  label: string
}) {
  const [active, setActive] = useState(false)

  return (
    <button
      className="flex flex-col gap-2"
      onClick={() => setActive((current) => !current)}
      type="button"
    >
      <div
        className={cn(
          "size-12 rounded-xl bg-primary transition-transform",
          durationClass,
          easeClass,
          active ? "translate-x-16" : "translate-x-0"
        )}
      />
      <p className="font-mono text-muted-foreground text-xs">{label}</p>
    </button>
  )
}

export function DesignTokensSection() {
  return (
    <div className="flex flex-col gap-6">
      <UiKitSection
        description="Semantic color tokens from styles.css"
        id="colors"
        importPath="src/styles.css"
        title="Colors"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {colorTokens.map((token) => (
            <div className="flex flex-col gap-2" key={token.name}>
              <div
                className={cn(
                  "h-14 rounded-xl border ring-1 ring-foreground/5",
                  token.className
                )}
              />
              <p className="font-mono text-muted-foreground text-xs">
                {token.name}
              </p>
            </div>
          ))}
        </div>
      </UiKitSection>

      <UiKitSection
        id="typography"
        importPath="src/styles.css"
        title="Typography"
      >
        <div className="flex flex-col gap-6">
          <p className="text-caption">
            Semantic typography utilities bundle size, line-height, tracking,
            and weight. Color is separate except{" "}
            <code className="text-mono">text-caption</code>.
          </p>
          {typographyScale.map((item) => (
            <div className="flex flex-col gap-1" key={item.label}>
              <p className={item.className}>{item.label} — Geist Variable</p>
              <p className="font-mono text-muted-foreground text-xs">
                {item.token}
              </p>
            </div>
          ))}
        </div>
      </UiKitSection>

      <UiKitSection id="spacing" importPath="src/styles.css" title="Spacing">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">Tailwind scale</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {spacingScale.map((item) => (
                <div className="flex flex-col gap-2" key={item.name}>
                  <div className={cn("flex", item.className)}>
                    <div className="size-4 rounded bg-primary" />
                    <div className="size-4 rounded bg-primary/60" />
                  </div>
                  <p className="font-mono text-muted-foreground text-xs">
                    gap-{item.name} ({item.size})
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">Semantic spacing</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {semanticSpacing.map((item) => (
                <div
                  className="flex flex-col gap-1 rounded-xl border p-3"
                  key={item.name}
                >
                  <p className="font-mono text-sm">{item.token}</p>
                  <p className="text-muted-foreground text-xs">{item.usage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </UiKitSection>

      <UiKitSection id="radius" importPath="src/styles.css" title="Radius">
        <div className="flex flex-wrap gap-4">
          {radiusTokens.map((token) => (
            <div className="flex flex-col items-center gap-2" key={token.name}>
              <div className={cn("size-16 border bg-muted", token.className)} />
              <p className="font-mono text-muted-foreground text-xs">
                radius-{token.name}
              </p>
            </div>
          ))}
        </div>
      </UiKitSection>

      <UiKitSection id="shadows" importPath="src/styles.css" title="Shadows">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {shadowTokens.map((token) => (
            <div className="flex flex-col gap-2" key={token.name}>
              <div
                className={cn(
                  "flex h-20 items-center justify-center rounded-xl bg-card",
                  token.name
                )}
              >
                <span className="font-mono text-muted-foreground text-xs">
                  {token.label}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">{token.usage}</p>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Aliases: <code className="text-xs">--shadow-surface</code> (sm),{" "}
          <code className="text-xs">--shadow-overlay</code> (xl)
        </p>
      </UiKitSection>

      <UiKitSection id="motion" importPath="src/styles.css" title="Motion">
        <p className="text-muted-foreground text-sm">
          Click each block to preview transition. Tokens map to{" "}
          <code className="text-xs">duration-*</code> and{" "}
          <code className="text-xs">ease-*</code> utilities.
        </p>
        <div className="flex flex-wrap gap-8">
          <MotionDemo
            durationClass="duration-fast"
            easeClass="ease-out"
            label="duration-fast (150ms)"
          />
          <MotionDemo
            durationClass="duration-normal"
            easeClass="ease-default"
            label="duration-normal (200ms)"
          />
          <MotionDemo
            durationClass="duration-slow"
            easeClass="ease-entrance"
            label="duration-slow + ease-entrance"
          />
        </div>
        <div className="grid gap-2 font-mono text-muted-foreground text-xs sm:grid-cols-2">
          <p>--motion-duration-fast: 150ms</p>
          <p>--motion-duration-normal: 200ms</p>
          <p>--motion-duration-slow: 500ms</p>
          <p>--motion-ease-entrance: cubic-bezier(0, 0.55, 0.45, 1)</p>
        </div>
      </UiKitSection>

      <UiKitSection
        id="logo-tokens"
        importPath="src/styles.css"
        title="Logo Tokens"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-8">
            <Logo className="size-16" />
            <Logo className="size-10" />
            <Logo className="size-6" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {logoTokenSwatches.map((token) => (
              <div className="flex flex-col gap-2" key={token.name}>
                <div
                  className="h-14 rounded-xl border ring-1 ring-foreground/5"
                  style={{ background: `var(${token.var})` }}
                />
                <p className="font-mono text-muted-foreground text-xs">
                  {token.name}
                </p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Logo colors adapt in <code className="text-xs">.dark</code> via
            semantic <code className="text-xs">--logo-*</code> aliases.
          </p>
        </div>
      </UiKitSection>
    </div>
  )
}
