import { createFileRoute } from "@tanstack/react-router"
import { useState, useRef } from "react"
import {
  Home01Icon,
  Analytics01Icon,
  Payment01Icon,
  UserIcon,
  BanknoteIcon,
  Message01Icon,
  Package01Icon,
  CopyLinkIcon,
  Invoice01Icon,
  Megaphone01Icon,
  More01Icon,
  Settings01Icon,
  Add01Icon,
  Search02Icon,
  BellIcon,
  ShuffleIcon,
  GraduationCapIcon,
  Cancel01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/dashboard-1")({
  component: DashboardPage,
})

// Datasets for interactive charts
const todayGrossData = [
  { label: "12:00 AM", val: 0 },
  { label: "2:00 AM", val: 0 },
  { label: "4:00 AM", val: 0 },
  { label: "6:00 AM", val: 0 },
  { label: "8:00 AM", val: 0 },
  { label: "10:00 AM", val: 0 },
  { label: "10:37 AM", val: 1.4 },
  { label: "2:00 PM", val: 1.4 },
  { label: "6:00 PM", val: 1.4 },
  { label: "12:00 AM", val: 1.4 },
]

const statsGrossData = [
  { label: "Feb 28", val: 0 },
  { label: "Mar 1", val: 0 },
  { label: "Mar 2", val: 0 },
  { label: "Mar 3", val: 0 },
  { label: "Mar 4", val: 0 },
  { label: "Mar 5", val: 0 },
  { label: "Today", val: 1.4 },
]

const statsNetData = [
  { label: "Feb 28", val: 0 },
  { label: "Mar 1", val: 0 },
  { label: "Mar 2", val: 0 },
  { label: "Mar 3", val: 0 },
  { label: "Mar 4", val: 0 },
  { label: "Mar 5", val: 0 },
  { label: "Today", val: 0.58 },
]

const statsUserData = [
  { label: "Feb 28", val: 0 },
  { label: "Mar 1", val: 0 },
  { label: "Mar 2", val: 0 },
  { label: "Mar 3", val: 0 },
  { label: "Mar 4", val: 2 },
  { label: "Mar 5", val: 0 },
  { label: "Today", val: 0 },
]

function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bannerOpen, setBannerOpen] = useState(true)

  // Interactive Chart States
  const [todayHoverIdx, setTodayHoverIdx] = useState<number | null>(null)
  const [statsGrossHoverIdx, setStatsGrossHoverIdx] = useState<number | null>(null)
  const [statsNetHoverIdx, setStatsNetHoverIdx] = useState<number | null>(null)
  const [statsUserHoverIdx, setStatsUserHoverIdx] = useState<number | null>(null)

  // Refs for width calculation
  const todayChartRef = useRef<SVGSVGElement>(null)
  const statsGrossRef = useRef<SVGSVGElement>(null)
  const statsNetRef = useRef<SVGSVGElement>(null)
  const statsUserRef = useRef<SVGSVGElement>(null)

  // Mouse Move Handlers to calculate nearest point
  const handleMouseMove = (
    e: React.MouseEvent<SVGSVGElement, MouseEvent>,
    ref: React.RefObject<SVGSVGElement | null>,
    dataLength: number,
    setHoverIdx: (idx: number | null) => void
  ) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const segmentWidth = width / (dataLength - 1)
    const idx = Math.max(0, Math.min(dataLength - 1, Math.round(x / segmentWidth)))
    setHoverIdx(idx)
  }

  return (
    <div className="flex min-h-svh w-full bg-[#f9fafb] text-foreground antialiased selection:bg-primary/10">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r bg-white transition-transform duration-300 md:sticky md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2.5">
            {/* Whop Orange Logo */}
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#ff5a1f] text-white shadow-xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M3 7l6 10 3-5 3 5 6-10" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-tight">
                Mob Design Courses
              </span>
            </div>
          </div>
          <button className="rounded-lg p-1 hover:bg-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {/* Business Home */}
          <div className="space-y-1">
            <a
              href="#"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Home01Icon} className="size-4.5" />
              <span>Business home</span>
            </a>
          </div>

          {/* Dashboard Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Dashboard
            </p>
            <div className="space-y-0.5">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-colors"
              >
                <HugeiconsIcon icon={Analytics01Icon} className="size-4.5" />
                <span>Analytics</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Payment01Icon} className="size-4.5" />
                <span>Payments</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={UserIcon} className="size-4.5" />
                <span>Users</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={BanknoteIcon} className="size-4.5" />
                <span>Balances</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Message01Icon} className="size-4.5" />
                <span>Support chats</span>
              </a>
            </div>
          </div>

          {/* Pinned Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pinned
            </p>
            <div className="space-y-0.5">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Package01Icon} className="size-4.5" />
                <span>Products</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={CopyLinkIcon} className="size-4.5" />
                <span>Checkout links</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Invoice01Icon} className="size-4.5" />
                <span>Invoices</span>
              </a>
            </div>
          </div>

          {/* All Tools Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              All tools
            </p>
            <div className="space-y-0.5">
              <a
                href="#"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={Megaphone01Icon} className="size-4.5" />
                  <span>Marketing</span>
                </div>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
              </a>
              <a
                href="#"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HugeiconsIcon icon={More01Icon} className="size-4.5" />
                  <span>More</span>
                </div>
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Apps Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Apps
            </p>
            <div className="space-y-0.5">
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <div className="flex size-4.5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-3">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <span>Automations</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4.5" />
                <span>Add</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-3 space-y-0.5">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <span className="text-xs font-semibold text-muted-foreground leading-none">&lt;/&gt;</span>
            <span>Developer</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Settings01Icon} className="size-4.5" />
            <span>Settings</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-white px-6">
          {/* Search Input */}
          <div className="relative w-80">
            <HugeiconsIcon
              icon={Search02Icon}
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search Mob Design Courses"
              className="w-full rounded-lg border bg-[#f9fafb] py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-4">
            {/* Chat Icon with Badge */}
            <button className="relative rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
              <HugeiconsIcon icon={Message01Icon} className="size-4.5" />
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ff5a1f] text-[9px] font-bold text-white">
                5
              </span>
            </button>

            {/* Shuffle Icon */}
            <button className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
              <HugeiconsIcon icon={ShuffleIcon} className="size-4.5" />
            </button>

            {/* Bell Icon */}
            <button className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
              <HugeiconsIcon icon={BellIcon} className="size-4.5" />
            </button>

            {/* Balance Box */}
            <div className="rounded-lg border bg-[#f9fafb] px-2.5 py-1 text-xs font-semibold text-foreground">
              $2.11
            </div>

            {/* Avatar */}
            <div className="flex size-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
              AS
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Today Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Today</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <div className="grid grid-cols-2 gap-0.5 size-3">
                    <div className="bg-foreground rounded-xs" />
                    <div className="bg-foreground rounded-xs" />
                    <div className="bg-foreground rounded-xs" />
                    <div className="bg-foreground rounded-xs" />
                  </div>
                  <span>Add apps</span>
                </button>
                <button className="rounded-lg border bg-white p-1.5 text-muted-foreground hover:bg-[#f9fafb]">
                  <HugeiconsIcon icon={BellIcon} className="size-4" />
                </button>
              </div>
            </div>

            {/* Today Cards Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Gross Revenue Card */}
              <div className="col-span-1 rounded-2xl border bg-white p-5 shadow-xs lg:col-span-2 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Gross revenue</span>
                      <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                        +100%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {todayHoverIdx !== null ? `$${todayGrossData[todayHoverIdx].val.toFixed(2)}` : "$1.40"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {todayHoverIdx !== null ? todayGrossData[todayHoverIdx].label : "10:37 AM"}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Yesterday</span>
                    <div className="text-sm font-semibold text-muted-foreground">$0.00</div>
                  </div>
                </div>

                {/* SVG Chart */}
                <div className="relative mt-6 h-36 w-full">
                  <svg
                    ref={todayChartRef}
                    className="size-full cursor-crosshair"
                    preserveAspectRatio="none"
                    onMouseMove={(e) => handleMouseMove(e, todayChartRef, todayGrossData.length, setTodayHoverIdx)}
                    onMouseLeave={() => setTodayHoverIdx(null)}
                  >
                    {/* Grid lines */}
                    <line x1="0" y1="120" x2="100%" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="80" x2="100%" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="40" x2="100%" y2="40" stroke="#f1f5f9" strokeWidth="1" />

                    {/* Chart Path */}
                    <path
                      d="M 0,120 L 150,120 L 250,120 L 350,120 L 450,120 L 550,120 L 580,20 L 620,20 L 1000,20"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />

                    {/* Interactive Hover Line & Dot */}
                    {todayHoverIdx !== null && (
                      <>
                        {/* Vertical line */}
                        <line
                          x1={`${(todayHoverIdx / (todayGrossData.length - 1)) * 100}%`}
                          y1="0"
                          x2={`${(todayHoverIdx / (todayGrossData.length - 1)) * 100}%`}
                          y2="120"
                          stroke="#3b82f6"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        {/* Hover Dot */}
                        <circle
                          cx={`${(todayHoverIdx / (todayGrossData.length - 1)) * 100}%`}
                          cy={todayGrossData[todayHoverIdx].val > 0 ? 20 : 120}
                          r="5"
                          fill="#2563eb"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </>
                    )}

                    {/* Default Peak circle */}
                    {todayHoverIdx === null && (
                      <circle cx="580" cy="20" r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
                    )}
                  </svg>

                  {/* X-Axis labels */}
                  <div className="absolute bottom-0 left-0 text-[10px] text-muted-foreground">12:00 AM</div>
                  <div className="absolute bottom-0 right-0 text-[10px] text-muted-foreground">12:00 AM</div>
                </div>
              </div>

              {/* Balance & Payouts Cards */}
              <div className="flex flex-col gap-4">
                {/* Total Balance Card */}
                <div className="rounded-2xl border bg-white p-5 shadow-xs flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Total balance</span>
                    <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">View</a>
                  </div>
                  <div className="space-y-1 my-2">
                    <div className="text-2xl font-bold text-foreground">$2.11</div>
                    <div className="text-[10px] text-muted-foreground">$0.00 available</div>
                  </div>
                </div>

                {/* Payouts Card */}
                <div className="rounded-2xl border bg-white p-5 shadow-xs flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Payouts</span>
                    <a href="#" className="text-xs font-semibold text-blue-600 hover:underline">View</a>
                  </div>
                  <div className="my-2">
                    <div className="text-2xl font-bold text-muted-foreground">--</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Whop University Banner */}
          {bannerOpen && (
            <div className="relative flex items-center justify-between rounded-xl bg-blue-50/70 border border-blue-100/50 px-4 py-3.5 text-xs text-blue-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={GraduationCapIcon} className="size-4 text-blue-600" />
                <span>
                  <a href="#" className="font-semibold underline hover:text-blue-950">Join Whop University</a> and start your path to your first $10K.
                </span>
              </div>
              <button
                onClick={() => setBannerOpen(false)}
                className="rounded-lg p-1 text-blue-600 hover:bg-blue-100/50 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              </button>
            </div>
          )}

          {/* Stats Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Stats</h2>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <span>Last 7 days</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-muted-foreground" />
                  <span>Feb 28 - Mar 6, 2026</span>
                </button>
                <span className="text-xs text-muted-foreground">compared to</span>
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <span>Previous period</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
                </button>
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <span>Daily</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
                </button>
                <span className="text-xs text-muted-foreground">on</span>
                <button className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <span>All products</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  <span>Add</span>
                </button>
                <button className="flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:bg-[#f9fafb]">
                  <HugeiconsIcon icon={Settings01Icon} className="size-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Gross Revenue Card */}
              <div className="rounded-2xl border bg-white p-5 shadow-xs space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Gross revenue</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {statsGrossHoverIdx !== null ? `$${statsGrossData[statsGrossHoverIdx].val.toFixed(2)}` : "$1.40"}
                      </span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                        +$1.40
                      </span>
                    </div>
                  </div>
                  <button className="rounded-lg p-1 hover:bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                  </button>
                </div>

                {/* SVG Chart */}
                <div className="relative h-28 w-full flex items-end">
                  {/* Y-Axis labels */}
                  <div className="absolute left-0 top-0 text-[9px] text-muted-foreground font-medium font-mono">1.4</div>
                  <div className="absolute left-0 top-1/4 text-[9px] text-muted-foreground font-medium font-mono">1</div>
                  <div className="absolute left-0 top-2/4 text-[9px] text-muted-foreground font-medium font-mono">0.7</div>
                  <div className="absolute left-0 top-3/4 text-[9px] text-muted-foreground font-medium font-mono">0.4</div>
                  <div className="absolute left-0 bottom-0 text-[9px] text-muted-foreground font-medium font-mono">0</div>

                  {/* Chart area */}
                  <div className="flex-1 pl-6 h-full relative">
                    <svg
                      ref={statsGrossRef}
                      className="size-full cursor-crosshair"
                      preserveAspectRatio="none"
                      onMouseMove={(e) => handleMouseMove(e, statsGrossRef, statsGrossData.length, setStatsGrossHoverIdx)}
                      onMouseLeave={() => setStatsGrossHoverIdx(null)}
                    >
                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="100%" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="28" x2="100%" y2="28" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="56" x2="100%" y2="56" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="84" x2="100%" y2="84" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Line */}
                      <path
                        d="M 0,112 L 200,112 L 250,112 L 300,10"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        className="w-full"
                      />

                      {/* Interactive Hover Line & Dot */}
                      {statsGrossHoverIdx !== null && (
                        <>
                          <line
                            x1={`${(statsGrossHoverIdx / (statsGrossData.length - 1)) * 100}%`}
                            y1="0"
                            x2={`${(statsGrossHoverIdx / (statsGrossData.length - 1)) * 100}%`}
                            y2="112"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                          />
                          <circle
                            cx={`${(statsGrossHoverIdx / (statsGrossData.length - 1)) * 100}%`}
                            cy={statsGrossData[statsGrossHoverIdx].val > 0 ? 10 : 112}
                            r="4"
                            fill="#2563eb"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* X-Axis labels */}
                <div className="flex items-center justify-between pl-6 text-[10px] text-muted-foreground">
                  <span>{statsGrossHoverIdx !== null ? statsGrossData[statsGrossHoverIdx].label : "Feb 28"}</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Net Revenue Card */}
              <div className="rounded-2xl border bg-white p-5 shadow-xs space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Net revenue</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {statsNetHoverIdx !== null ? `$${statsNetData[statsNetHoverIdx].val.toFixed(2)}` : "$0.58"}
                      </span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                        +$0.58
                      </span>
                    </div>
                  </div>
                  <button className="rounded-lg p-1 hover:bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                  </button>
                </div>

                {/* SVG Chart */}
                <div className="relative h-28 w-full flex items-end">
                  {/* Y-Axis labels */}
                  <div className="absolute left-0 top-0 text-[9px] text-muted-foreground font-medium font-mono">0.6</div>
                  <div className="absolute left-0 top-1/4 text-[9px] text-muted-foreground font-medium font-mono">0.4</div>
                  <div className="absolute left-0 top-2/4 text-[9px] text-muted-foreground font-medium font-mono">0.3</div>
                  <div className="absolute left-0 top-3/4 text-[9px] text-muted-foreground font-medium font-mono">0.1</div>
                  <div className="absolute left-0 bottom-0 text-[9px] text-muted-foreground font-medium font-mono">0</div>

                  {/* Chart area */}
                  <div className="flex-1 pl-6 h-full relative">
                    <svg
                      ref={statsNetRef}
                      className="size-full cursor-crosshair"
                      preserveAspectRatio="none"
                      onMouseMove={(e) => handleMouseMove(e, statsNetRef, statsNetData.length, setStatsNetHoverIdx)}
                      onMouseLeave={() => setStatsNetHoverIdx(null)}
                    >
                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="100%" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="28" x2="100%" y2="28" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="56" x2="100%" y2="56" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="84" x2="100%" y2="84" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Line */}
                      <path
                        d="M 0,112 L 200,112 L 250,112 L 300,10"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        className="w-full"
                      />

                      {/* Interactive Hover Line & Dot */}
                      {statsNetHoverIdx !== null && (
                        <>
                          <line
                            x1={`${(statsNetHoverIdx / (statsNetData.length - 1)) * 100}%`}
                            y1="0"
                            x2={`${(statsNetHoverIdx / (statsNetData.length - 1)) * 100}%`}
                            y2="112"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                          />
                          <circle
                            cx={`${(statsNetHoverIdx / (statsNetData.length - 1)) * 100}%`}
                            cy={statsNetData[statsNetHoverIdx].val > 0 ? 10 : 112}
                            r="4"
                            fill="#2563eb"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* X-Axis labels */}
                <div className="flex items-center justify-between pl-6 text-[10px] text-muted-foreground">
                  <span>{statsNetHoverIdx !== null ? statsNetData[statsNetHoverIdx].label : "Feb 28"}</span>
                  <span>Today</span>
                </div>
              </div>

              {/* New Users Card */}
              <div className="rounded-2xl border bg-white p-5 shadow-xs space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">New users</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {statsUserHoverIdx !== null ? statsUserData[statsUserHoverIdx].val : "2"}
                      </span>
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">
                        +2
                      </span>
                    </div>
                  </div>
                  <button className="rounded-lg p-1 hover:bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
                  </button>
                </div>

                {/* SVG Chart */}
                <div className="relative h-28 w-full flex items-end">
                  {/* Y-Axis labels */}
                  <div className="absolute left-0 top-0 text-[9px] text-muted-foreground font-medium font-mono">2</div>
                  <div className="absolute left-0 top-1/4 text-[9px] text-muted-foreground font-medium font-mono">1.5</div>
                  <div className="absolute left-0 top-2/4 text-[9px] text-muted-foreground font-medium font-mono">1</div>
                  <div className="absolute left-0 top-3/4 text-[9px] text-muted-foreground font-medium font-mono">0.5</div>
                  <div className="absolute left-0 bottom-0 text-[9px] text-muted-foreground font-medium font-mono">0</div>

                  {/* Chart area */}
                  <div className="flex-1 pl-6 h-full relative">
                    <svg
                      ref={statsUserRef}
                      className="size-full cursor-crosshair"
                      preserveAspectRatio="none"
                      onMouseMove={(e) => handleMouseMove(e, statsUserRef, statsUserData.length, setStatsUserHoverIdx)}
                      onMouseLeave={() => setStatsUserHoverIdx(null)}
                    >
                      {/* Grid lines */}
                      <line x1="0" y1="0" x2="100%" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="28" x2="100%" y2="28" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="56" x2="100%" y2="56" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="84" x2="100%" y2="84" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Line with a peak and drop */}
                      <path
                        d="M 0,112 L 180,112 L 230,10 L 280,112 L 300,112"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="1.5"
                        className="w-full"
                      />

                      {/* Interactive Hover Line & Dot */}
                      {statsUserHoverIdx !== null && (
                        <>
                          <line
                            x1={`${(statsUserHoverIdx / (statsUserData.length - 1)) * 100}%`}
                            y1="0"
                            x2={`${(statsUserHoverIdx / (statsUserData.length - 1)) * 100}%`}
                            y2="112"
                            stroke="#3b82f6"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                          />
                          <circle
                            cx={`${(statsUserHoverIdx / (statsUserData.length - 1)) * 100}%`}
                            cy={statsUserHoverIdx === 4 ? 10 : 112}
                            r="4"
                            fill="#2563eb"
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                {/* X-Axis labels */}
                <div className="flex items-center justify-between pl-6 text-[10px] text-muted-foreground">
                  <span>{statsUserHoverIdx !== null ? statsUserData[statsUserHoverIdx].label : "Feb 28"}</span>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
