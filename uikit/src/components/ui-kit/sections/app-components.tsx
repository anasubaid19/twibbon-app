"use client"

import { useState } from "react"
import { FacebookIcon } from "@/components/facebook-icon"
import { Header } from "@/components/header"
import { HeaderMenu } from "@/components/header-menu"
import { HeroSection } from "@/components/hero"
import { LinkedinIcon } from "@/components/linkedin-icon"
import { Logo, LogoIcon } from "@/components/logo"
import { LogoCloud } from "@/components/logo-cloud"
import { LogosSection } from "@/components/logos-section"
import { PricingSection } from "@/components/pricing-section"
import { InfrastructureSection } from "@/components/infrastructure-section"
import { TeamSection } from "@/components/team-section"
import { MetricsSection } from "@/components/metrics-section"
import { Footer } from "@/components/footer"
import { Portal, PortalBackdrop } from "@/components/portal"
import { Button } from "@/components/ui/button"
import { UiKitSection } from "@/components/ui-kit/ui-kit-section"
import { XIcon } from "@/components/x-icon"
import { YoutubeIcon } from "@/components/youtube-icon"

export function AppComponentsSection() {
  const [portalOpen, setPortalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <UiKitSection id="logo" importPath="@/components/logo" title="Logo">
        <div className="flex flex-wrap items-end gap-8">
          <div className="flex flex-col gap-2">
            <Logo className="size-6" />
            <p className="text-muted-foreground text-xs">Logo</p>
          </div>
          <div className="flex flex-col gap-2">
            <LogoIcon className="size-8" />
            <p className="text-muted-foreground text-xs">LogoIcon</p>
          </div>
        </div>
      </UiKitSection>

      <UiKitSection id="header" importPath="@/components/header" title="Header">
        <div className="relative overflow-hidden rounded-xl border bg-muted/30 py-4">
          <Header />
        </div>
      </UiKitSection>

      <UiKitSection
        id="header-menu"
        importPath="@/components/header-menu"
        title="Header Menu"
      >
        <div className="flex justify-end">
          <HeaderMenu />
        </div>
      </UiKitSection>

      <UiKitSection
        className="overflow-hidden p-0"
        id="hero"
        importPath="@/components/hero"
        title="Hero"
      >
        <div className="max-h-[600px] overflow-y-auto">
          <HeroSection />
        </div>
      </UiKitSection>

      <UiKitSection
        id="logos-section"
        importPath="@/components/logos-section"
        title="Logos Section"
      >
        <LogosSection />
      </UiKitSection>

      <UiKitSection
        id="logo-cloud"
        importPath="@/components/logo-cloud"
        title="Logo Cloud"
      >
        <LogoCloud />
      </UiKitSection>

      <UiKitSection id="portal" importPath="@/components/portal" title="Portal">
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            Opens a full-screen portal and locks body scroll while mounted.
          </p>
          <Button onClick={() => setPortalOpen(true)}>Open portal</Button>
          {portalOpen ? (
            <Portal>
              <PortalBackdrop />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
                <p className="font-medium text-lg">Portal content</p>
                <Button onClick={() => setPortalOpen(false)}>Close</Button>
              </div>
            </Portal>
          ) : null}
        </div>
      </UiKitSection>

      <UiKitSection
        id="social-icons"
        importPath="@/components/*-icon"
        title="Social Icons"
      >
        <div className="flex flex-wrap gap-4">
          <FacebookIcon className="size-6" />
          <LinkedinIcon className="size-6" />
          <XIcon className="size-6" />
          <YoutubeIcon className="size-6" />
        </div>
      </UiKitSection>

      <UiKitSection
        id="metrics-section"
        importPath="@/components/metrics-section"
        title="Metrics Section"
      >
        <MetricsSection />
      </UiKitSection>

      <UiKitSection
        id="team-section"
        importPath="@/components/team-section"
        title="Team Section"
      >
        <TeamSection />
      </UiKitSection>

      <UiKitSection
        id="pricing-section"
        importPath="@/components/pricing-section"
        title="Pricing Section"
      >
        <PricingSection />
      </UiKitSection>

      <UiKitSection
        id="infrastructure-section"
        importPath="@/components/infrastructure-section"
        title="Infrastructure Section"
      >
        <InfrastructureSection />
      </UiKitSection>

      <UiKitSection
        id="footer"
        importPath="@/components/footer"
        title="Footer"
      >
        <Footer />
      </UiKitSection>
    </div>
  )
}
