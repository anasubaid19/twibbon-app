"use client"

import { useState } from "react"
import {
  ArrowRight02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function InfrastructureSection() {
  // Card 1: AI Chat Mockup State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "user",
      text: "Help me integrate with my existing tech stack",
    },
    {
      id: 2,
      sender: "assistant",
      text: "There are hundreds of Medusa integrations, which ones do you need? I will guide you on the setup.",
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: inputValue,
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "assistant",
          text: `Awesome! I can absolutely help you configure that integration. Let's get it set up right away!`,
        },
      ])
    }, 1000)
  }

  // Card 3: Hover Tooltip State
  const [hoveredBar, setHoveredBar] = useState<number | null>(2) // Default to index 2 (Jun 3)

  // Data for Card 3 (Flex Charges Stacked Bars)
  const billingData = [
    { date: "Jun 1", dataTransfer: 1.2, objectStorage: 0.8 },
    { date: "Jun 2", dataTransfer: 1.8, objectStorage: 1.1 },
    { date: "Jun 3", dataTransfer: 2.37, objectStorage: 1.88 }, // Highlighted in image
    { date: "Jun 4", dataTransfer: 1.5, objectStorage: 0.9 },
    { date: "Jun 5", dataTransfer: 2.1, objectStorage: 1.4 },
    { date: "Jun 6", dataTransfer: 2.8, objectStorage: 1.9 },
    { date: "Jun 7", dataTransfer: 1.9, objectStorage: 1.2 },
    { date: "Jun 8", dataTransfer: 2.4, objectStorage: 1.6 },
    { date: "Jun 9", dataTransfer: 1.7, objectStorage: 1.1 },
    { date: "Jun 10", dataTransfer: 2.2, objectStorage: 1.5 },
  ]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
      {/* Section Header */}
      <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
        <div className="flex flex-col items-start justify-start gap-2">
          <span className="text-label text-muted-foreground uppercase tracking-wider">
            Medusa Cloud
          </span>
          <h2 className="text-display text-foreground max-w-xl">
            Get the most out of Medusa with AI-enabling infrastructure
          </h2>
        </div>
        <p className="text-lead text-muted-foreground max-w-md md:pb-2">
          Performant infrastructure with built-in AI features and support tools
          on Cloud
        </p>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {/* Card 1: AI tools on Cloud */}
        <Card className="relative flex flex-col border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          {/* Visual Mockup Container */}
          <div className="relative flex h-[280px] flex-col rounded-2xl border bg-muted/20 p-4 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex w-full flex-col",
                      msg.sender === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {msg.sender === "user" ? (
                      <div className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground text-sm max-w-[85%] shadow-xs">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 w-full max-w-[90%]">
                        {/* Avatar Row */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80"
                              alt="Stripe"
                              className="inline-block size-5 rounded-full border border-background object-cover"
                            />
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&auto=format&q=80"
                              alt="GitHub"
                              className="inline-block size-5 rounded-full border border-background object-cover"
                            />
                            <img
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&auto=format&q=80"
                              alt="Slack"
                              className="inline-block size-5 rounded-full border border-background object-cover"
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            +2 integrations
                          </span>
                        </div>
                        {/* Message Bubble */}
                        <div className="rounded-2xl border bg-card px-4 py-2.5 text-foreground text-sm shadow-xs">
                          {msg.text}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="relative mt-3 flex items-center"
            >
              <input
                type="text"
                placeholder="Start typing..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full rounded-xl border bg-card py-2 pl-3 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              >
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
              </button>
            </form>
          </div>

          {/* Text Content */}
          <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-title font-semibold text-foreground">
                AI tools on Cloud
              </h3>
              <p className="text-body text-muted-foreground">
                MCP, Development Agent, Cloud CLI, access AI tooling with deep
                Medusa knowledge.
              </p>
            </div>
            <a
              href="#ai-tooling"
              className="group flex w-fit items-center gap-1 text-label font-medium text-foreground hover:underline"
            >
              AI tooling
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                strokeWidth={2}
                className="size-3.5 transition-transform duration-fast ease-out group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </Card>

        {/* Card 2: Best performance */}
        <Card className="relative flex flex-col border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          {/* Visual Mockup Container */}
          <div className="relative flex h-[280px] flex-col rounded-2xl border bg-muted/20 p-4 overflow-hidden">
            {/* Traffic Line Chart */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Traffic
                </span>
              </div>

              {/* SVG Chart Area */}
              <div className="relative h-[120px] w-full">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-border/60" />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-border/60" />
                <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-border/60" />

                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-0 text-[9px] text-muted-foreground font-medium">
                  20K
                </div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground font-medium">
                  10K
                </div>
                <div className="absolute left-0 bottom-0 text-[9px] text-muted-foreground font-medium">
                  0
                </div>

                {/* SVG Path */}
                <svg className="absolute inset-0 size-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Area Path */}
                  <path
                    d="M 30,100 C 60,80 80,95 110,60 C 140,30 170,45 200,35 C 230,25 260,50 290,15"
                    fill="none"
                    stroke="oklch(0.769 0.188 70.08)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="w-full"
                  />
                  <path
                    d="M 30,100 C 60,80 80,95 110,60 C 140,30 170,45 200,35 C 230,25 260,50 290,15 L 290,120 L 30,120 Z"
                    fill="url(#chart-gradient)"
                  />
                  {/* Pulsing glow dot at the end */}
                  <circle cx="290" cy="15" r="4" fill="oklch(0.769 0.188 70.08)" />
                  <circle cx="290" cy="15" r="8" fill="oklch(0.769 0.188 70.08)" fillOpacity="0.3" className="animate-ping" />
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="flex items-center justify-between px-2 text-[9px] text-muted-foreground font-medium">
                <span>24h ago</span>
                <span>12h ago</span>
                <span>Now</span>
              </div>
            </div>

            <div className="my-3 border-t border-border/40" />

            {/* Server Size Scaling Indicator */}
            <div className="flex flex-col gap-1.5 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Server size
                </span>
                <span className="text-[10px] font-medium text-foreground">
                  Automatically scale to handle any level of demand.
                </span>
              </div>
              {/* Row of vertical scaling bars */}
              <div className="flex h-8 items-end gap-1">
                {[2, 3, 2, 4, 5, 4, 6, 7, 8, 6, 5, 4, 3, 4, 5, 6, 8, 9, 7, 5, 4, 3, 2].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-linear-to-t transition-all duration-300"
                    style={{
                      height: `${val * 10}%`,
                      backgroundColor: val > 7 
                        ? "oklch(0.769 0.188 70.08)" // Orange
                        : val > 4 
                        ? "oklch(0.879 0.169 91.605)" // Yellowish
                        : "oklch(0.666 0.179 58.318)", // Greenish
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-title font-semibold text-foreground">
                Best performance
              </h3>
              <p className="text-body text-muted-foreground">
                Operate with the ease of a SaaS setup, with the most performant
                infrastructure for Medusa.
              </p>
            </div>
            <a
              href="#infrastructure"
              className="group flex w-fit items-center gap-1 text-label font-medium text-foreground hover:underline"
            >
              Infrastructure
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                strokeWidth={2}
                className="size-3.5 transition-transform duration-fast ease-out group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </Card>

        {/* Card 3: No hidden fees */}
        <Card className="relative flex flex-col border bg-card p-6 shadow-sm transition-all hover:shadow-md">
          {/* Visual Mockup Container */}
          <div className="relative flex h-[280px] flex-col rounded-2xl border bg-muted/20 p-4 overflow-hidden">
            {/* Header Dropdowns */}
            <div className="flex items-center justify-between gap-2">
              {/* Billing Cycle Selector */}
              <div className="flex items-center gap-1 rounded-lg border bg-card px-2 py-1 text-[9px] font-medium text-foreground shadow-xs">
                <span>Current billing cycle</span>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-2.5 text-muted-foreground" />
              </div>
              {/* Date Selector */}
              <div className="flex items-center gap-1 rounded-lg border bg-card px-2 py-1 text-[9px] font-medium text-foreground shadow-xs">
                <HugeiconsIcon icon={Calendar03Icon} className="size-2.5 text-muted-foreground" />
                <span>1/6 09:00 - 1/7 09:00</span>
              </div>
            </div>

            {/* Total Flex Charges */}
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">
                Total flex charges
              </span>
              <span className="text-base font-semibold text-foreground">
                $141.00
              </span>
            </div>

            {/* Stacked Bar Chart */}
            <div className="relative mt-4 flex flex-1 items-end gap-2.5 pb-2">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-2 border-b border-border/40" />
              <div className="absolute inset-x-0 bottom-1/2 border-b border-dashed border-border/40" />
              <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-border/40" />

              {/* Y-Axis labels */}
              <div className="absolute left-0 top-1/3 -translate-y-1/2 text-[8px] text-muted-foreground font-medium">
                $10
              </div>
              <div className="absolute left-0 bottom-1/2 -translate-y-1/2 text-[8px] text-muted-foreground font-medium">
                $5
              </div>
              <div className="absolute left-0 bottom-2 text-[8px] text-muted-foreground font-medium">
                $0
              </div>

              {/* Bars */}
              <div className="flex flex-1 items-end justify-between pl-6 h-full">
                {billingData.map((data, idx) => {
                  const totalVal = data.dataTransfer + data.objectStorage
                  const isHovered = hoveredBar === idx

                  return (
                    <div
                      key={idx}
                      className="relative flex flex-col items-center group cursor-pointer"
                      style={{ height: "70%" }}
                      onMouseEnter={() => setHoveredBar(idx)}
                    >
                      {/* Stacked Bar */}
                      <div className="flex flex-col-reverse w-3.5 rounded-xs overflow-hidden transition-all duration-200 group-hover:scale-x-110">
                        {/* Blue: Data Transfer */}
                        <div
                          className={cn(
                            "w-full transition-colors",
                            isHovered ? "bg-blue-600" : "bg-blue-500/80"
                          )}
                          style={{ height: `${(data.dataTransfer / 5) * 100}%`, minHeight: "6px" }}
                        />
                        {/* Purple: Object Storage */}
                        <div
                          className={cn(
                            "w-full transition-colors",
                            isHovered ? "bg-purple-600" : "bg-purple-500/80"
                          )}
                          style={{ height: `${(data.objectStorage / 5) * 100}%`, minHeight: "4px" }}
                        />
                      </div>

                      {/* X-Axis Date (Only show first and hovered/selected) */}
                      {(idx === 0 || isHovered) && (
                        <span className="absolute -bottom-4 text-[8px] text-muted-foreground font-medium whitespace-nowrap">
                          {data.date}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Floating Tooltip */}
              <AnimatePresence>
                {hoveredBar !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-4 top-10 z-20 flex flex-col gap-1.5 rounded-xl border bg-card p-2.5 shadow-md min-w-[120px]"
                  >
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {billingData[hoveredBar].date}, 2025
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-blue-500" />
                          <span className="text-[9px] text-foreground font-medium">Data Transfer</span>
                        </div>
                        <span className="text-[9px] font-semibold text-foreground">
                          ${billingData[hoveredBar].dataTransfer.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          <span className="size-1.5 rounded-full bg-purple-500" />
                          <span className="text-[9px] text-foreground font-medium font-sans">Object Storage</span>
                        </div>
                        <span className="text-[9px] font-semibold text-foreground">
                          ${billingData[hoveredBar].objectStorage.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Text Content */}
          <div className="mt-6 flex flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-title font-semibold text-foreground">
                No hidden fees
              </h3>
              <p className="text-body text-muted-foreground">
                Only pay for the infrastructure, no extra licenses or GMV tax.
              </p>
            </div>
            <a
              href="#pricing"
              className="group flex w-fit items-center gap-1 text-label font-medium text-foreground hover:underline"
            >
              Pricing
              <HugeiconsIcon
                icon={ArrowRight02Icon}
                strokeWidth={2}
                className="size-3.5 transition-transform duration-fast ease-out group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </Card>
      </div>
    </section>
  )
}
