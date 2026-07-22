import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  Home01Icon,
  Clock01Icon,
  Globe02Icon,
  Search02Icon,
  Analytics01Icon,
  Database01Icon,
  Shield01Icon,
  UserSettings01Icon,
  ArrowRight01Icon,
  Add01Icon,
  MoreHorizontalCircle01Icon,
  SparklesIcon,
  HelpCircleIcon,
  UserIcon,
  Key01Icon,
  CloudIcon,
  CheckmarkBadge01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  StarIcon,
  Diamond01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dashboard-2")({
  component: CloudflareDashboard,
})

function CloudflareDashboard() {
  const [activeTab, setActiveTab] = useState<"All" | "Dashboard" | "API">("All")

  return (
    <div className="flex min-h-svh w-full bg-[#f5f6f8] text-foreground antialiased selection:bg-primary/10">
      {/* Left Sidebar */}
      <aside className="sticky top-0 hidden h-svh w-56 flex-col border-r bg-white md:flex">
        {/* Header */}
        <div className="flex h-12 items-center gap-2 border-b px-4">
          {/* Cloudflare Orange Cloud Logo */}
          <div className="flex size-6 items-center justify-center text-[#f38020]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground leading-none">
            Faiz Intifada
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5">
          <div className="relative">
            <HugeiconsIcon
              icon={Search02Icon}
              className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full rounded-md border bg-[#f5f6f8] py-1 pl-8 pr-8 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm border bg-white px-1 py-0.5 text-[8px] text-muted-foreground">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 text-[11px] font-medium text-muted-foreground scrollbar-thin">
          <div className="space-y-0.5">
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md bg-[#f5f6f8] px-2.5 py-1.5 font-semibold text-foreground"
            >
              <HugeiconsIcon icon={Home01Icon} className="size-4 text-foreground" />
              <span>Account home</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
              <span>Recents</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Globe02Icon} className="size-4" />
              <span>Domains</span>
            </a>
          </div>

          {/* Observe */}
          <div className="space-y-0.5">
            <p className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Observe
            </p>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Search02Icon} className="size-4" />
              <span>Investigate</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Analytics01Icon} className="size-4" />
              <span>Analytics</span>
            </a>
          </div>

          {/* Build */}
          <div className="space-y-0.5">
            <p className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Build
            </p>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={CloudIcon} className="size-4" />
              <span>Compute</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-4" />
              <span>AI</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Database01Icon} className="size-4" />
              <span>Storage & databases</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Globe02Icon} className="size-4" />
              <span>Media</span>
            </a>
          </div>

          {/* Protect & Connect */}
          <div className="space-y-0.5">
            <p className="px-2.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Protect & Connect
            </p>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Shield01Icon} className="size-4" />
              <span>Application security</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Shield01Icon} className="size-4" />
              <span>Zero Trust</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Globe02Icon} className="size-4" />
              <span>Networking</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={CloudIcon} className="size-4" />
              <span>Delivery & performance</span>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t p-2 space-y-0.5 text-[11px] font-medium text-muted-foreground">
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 hover:bg-[#f5f6f8] hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={UserSettings01Icon} className="size-4" />
            <span>Manage account</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-12 items-center justify-between border-b bg-white px-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-muted-foreground leading-none">
              Account home
            </span>
            <h1 className="text-sm font-bold text-foreground mt-0.5">
              Faiz Intifada
            </h1>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-3">
            {/* Ask AI */}
            <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-[#f5f6f8] transition-colors">
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5 text-purple-600" />
              <span>Ask AI</span>
            </button>

            {/* Support */}
            <button className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-[#f5f6f8] transition-colors">
              <HugeiconsIcon icon={HelpCircleIcon} className="size-3.5" />
              <span>Support</span>
            </button>

            {/* User Profile */}
            <div className="flex size-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
              FI
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Analytics Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Analytics
            </h2>

            {/* Time Filter Dropdown */}
            <button className="flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs hover:bg-[#f5f6f8]">
              <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-muted-foreground" />
              <span>Last 24 hours</span>
            </button>
          </div>

          {/* Row of 3 Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: Security */}
            <div className="rounded-xl border bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 border-b pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <HugeiconsIcon icon={Shield01Icon} className="size-4 text-muted-foreground" />
                <span>Security</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    Security insights
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-foreground">27</span>
                    <span className="text-[9px] text-muted-foreground">
                      14 high, 13 low
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    Logins blocked
                  </span>
                  <div className="text-lg font-bold text-foreground">0</div>
                </div>
              </div>
            </div>

            {/* Card 2: Performance */}
            <div className="rounded-xl border bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 border-b pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <HugeiconsIcon icon={CloudIcon} className="size-4 text-muted-foreground" />
                <span>Performance</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    Cache rate
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">13.2%</span>
                    <span className="flex items-center text-[9px] text-red-500 font-semibold">
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-2.5" />
                      48.1%
                    </span>
                  </div>
                  {/* Small line chart */}
                  <div className="h-6 w-full pt-1.5">
                    <svg className="size-full" preserveAspectRatio="none">
                      <path
                        d="M 0,20 L 20,18 L 40,22 L 60,15 L 80,10 L 100,20"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    CPU time (P90)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">850.3 ms</span>
                    <span className="flex items-center text-[9px] text-red-500 font-semibold">
                      <HugeiconsIcon icon={ArrowUp01Icon} className="size-2.5" />
                      7.3%
                    </span>
                  </div>
                  {/* Small line chart */}
                  <div className="h-6 w-full pt-1.5">
                    <svg className="size-full" preserveAspectRatio="none">
                      <path
                        d="M 0,15 L 20,20 L 40,10 L 60,5 L 80,12 L 100,8"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Activity */}
            <div className="rounded-xl border bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 border-b pb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <HugeiconsIcon icon={Analytics01Icon} className="size-4 text-muted-foreground" />
                <span>Activity</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    Web traffic
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">30.16k</span>
                    <span className="flex items-center text-[9px] text-red-500 font-semibold">
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-2.5" />
                      17.8%
                    </span>
                  </div>
                  {/* Small line chart */}
                  <div className="h-6 w-full pt-1.5">
                    <svg className="size-full" preserveAspectRatio="none">
                      <path
                        d="M 0,22 L 20,18 L 40,15 L 60,20 L 80,10 L 100,18"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    Workers invocations
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-foreground">7.78k</span>
                    <span className="flex items-center text-[9px] text-red-500 font-semibold">
                      <HugeiconsIcon icon={ArrowDown01Icon} className="size-2.5" />
                      21.3%
                    </span>
                  </div>
                  {/* Small line chart */}
                  <div className="h-6 w-full pt-1.5">
                    <svg className="size-full" preserveAspectRatio="none">
                      <path
                        d="M 0,20 L 20,15 L 40,22 L 60,18 L 80,12 L 100,20"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of 3 Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Column 1: Domains */}
            <div className="rounded-xl border bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                    <span>Domains</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      6
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={StarIcon} className="size-3.5" />
                    </button>
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                    </button>
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Domains List */}
                <div className="divide-y text-xs">
                  {[
                    { name: "absenin.id", visitors: "17K" },
                    { name: "isometricon.com", visitors: "8.7K" },
                    { name: "vibedevid.com", visitors: "3.2K" },
                    { name: "faizintifada.com", visitors: "893" },
                    { name: "openbanana.fun", visitors: "432" },
                  ].map((dom, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4 text-green-600" />
                        <span className="font-medium text-foreground">{dom.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Sparkline */}
                        <div className="h-4 w-12">
                          <svg className="size-full" preserveAspectRatio="none">
                            <path
                              d={idx % 2 === 0 
                                ? "M 0,12 L 10,8 L 20,14 L 30,5 L 40,10 L 48,2" 
                                : "M 0,5 L 10,12 L 20,8 L 30,14 L 40,2 L 48,10"
                              }
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="1"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground min-w-[28px] text-right">
                          {dom.visitors}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Workers and Pages */}
            <div className="rounded-xl border bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                    <span>Workers and Pages</span>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                      11
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                    </button>
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Workers List */}
                <div className="divide-y text-xs">
                  {[
                    { name: "faiz-ui", time: "10 minutes ago" },
                    { name: "create-faiz-ui-tokens", time: "4 hours ago" },
                    { name: "isometricon", time: "3 days ago" },
                    { name: "rawblocks", time: "4 days ago" },
                    { name: "vibedevid", time: "5 days ago" },
                  ].map((work, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Diamond01Icon} className="size-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{work.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="underline decoration-dotted">{work.time}</span>
                        <button className="hover:text-foreground">
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Zero Trust Security */}
            <div className="rounded-xl border bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b pb-2.5">
                  <span className="text-[11px] font-bold text-foreground">
                    Zero Trust security
                  </span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                    </button>
                    <button className="hover:text-foreground">
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Zero Trust List */}
                <div className="divide-y text-xs">
                  {[
                    { label: "Used / total seats", val: "0 / 0", icon: UserIcon },
                    { label: "Access controls applications", val: "0", icon: Key01Icon },
                    { label: "Cloud and SaaS findings", val: "0", icon: CloudIcon },
                    { label: "DNS policies", val: "0", icon: Shield01Icon },
                    { label: "Tunnels", val: "2", icon: Globe02Icon },
                  ].map((zt, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={zt.icon} className="size-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{zt.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {zt.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid of 2 Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Column 1: Audit Logs */}
            <div className="rounded-xl border bg-white p-4 shadow-xs lg:col-span-3">
              <div className="flex items-center justify-between border-b pb-2.5">
                <span className="text-[11px] font-bold text-foreground">
                  Audit logs
                </span>
                <button className="text-muted-foreground hover:text-foreground">
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 border-b text-[11px] font-semibold text-muted-foreground pt-2">
                {(["All", "Dashboard", "API"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "pb-2 transition-colors relative",
                      activeTab === tab 
                        ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                        : "hover:text-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Logs List */}
              <div className="divide-y text-xs pt-1">
                {[
                  { title: "Upload Version", type: "workers" },
                  { title: "Create Assets Upload ...", type: "workers" },
                  { title: "Post Worker subdomain", type: "workers" },
                  { title: "Patch Script Settings", type: "workers" },
                  { title: "Create Deployment", type: "workers" },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <span className="font-semibold text-foreground">{log.title}</span>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                      <span>{log.type}</span>
                      <span className="underline decoration-dotted">10m ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Next Steps */}
            <div className="rounded-xl border bg-white p-4 shadow-xs lg:col-span-2">
              <div className="border-b pb-2.5">
                <span className="text-[11px] font-bold text-foreground">
                  Next steps
                </span>
              </div>

              {/* Next Steps List */}
              <div className="divide-y text-xs">
                {[
                  "Enable single sign-on to improve login security",
                  "Invite teammates and back-up admins",
                  "Get alerts for billing, attacks, and more",
                ].map((step, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className="flex items-center justify-between py-3.5 group hover:text-blue-600 transition-colors"
                  >
                    <span className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                      {step}
                    </span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-4 text-muted-foreground group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
