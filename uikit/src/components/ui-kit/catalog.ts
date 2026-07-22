export type CatalogItem = {
  id: string
  label: string
  importPath: string
}

export type CatalogCategory = {
  id: string
  label: string
  items: CatalogItem[]
}

export const catalogCategories: CatalogCategory[] = [
  {
    id: "tokens",
    label: "Design Tokens",
    items: [
      {
        id: "colors",
        label: "Colors",
        importPath: "src/styles.css",
      },
      {
        id: "typography",
        label: "Typography",
        importPath: "src/styles.css",
      },
      {
        id: "radius",
        label: "Radius",
        importPath: "src/styles.css",
      },
      {
        id: "spacing",
        label: "Spacing",
        importPath: "src/styles.css",
      },
      {
        id: "shadows",
        label: "Shadows",
        importPath: "src/styles.css",
      },
      {
        id: "motion",
        label: "Motion",
        importPath: "src/styles.css",
      },
      {
        id: "logo-tokens",
        label: "Logo Tokens",
        importPath: "src/styles.css",
      },
    ],
  },
  {
    id: "app",
    label: "App Components",
    items: [
      { id: "logo", label: "Logo", importPath: "@/components/logo" },
      { id: "header", label: "Header", importPath: "@/components/header" },
      {
        id: "header-menu",
        label: "Header Menu",
        importPath: "@/components/header-menu",
      },
      { id: "hero", label: "Hero", importPath: "@/components/hero" },
      {
        id: "logos-section",
        label: "Logos Section",
        importPath: "@/components/logos-section",
      },
      {
        id: "logo-cloud",
        label: "Logo Cloud",
        importPath: "@/components/logo-cloud",
      },
      { id: "portal", label: "Portal", importPath: "@/components/portal" },
      {
        id: "social-icons",
        label: "Social Icons",
        importPath: "@/components/*-icon",
      },
      {
        id: "metrics-section",
        label: "Metrics Section",
        importPath: "@/components/metrics-section",
      },
      {
        id: "team-section",
        label: "Team Section",
        importPath: "@/components/team-section",
      },
      {
        id: "pricing-section",
        label: "Pricing Section",
        importPath: "@/components/pricing-section",
      },
      {
        id: "infrastructure-section",
        label: "Infrastructure Section",
        importPath: "@/components/infrastructure-section",
      },
      {
        id: "footer",
        label: "Footer",
        importPath: "@/components/footer",
      },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      {
        id: "accordion",
        label: "Accordion",
        importPath: "@/components/ui/accordion",
      },
      {
        id: "alert-dialog",
        label: "Alert Dialog",
        importPath: "@/components/ui/alert-dialog",
      },
      { id: "badge", label: "Badge", importPath: "@/components/ui/badge" },
      { id: "button", label: "Button", importPath: "@/components/ui/button" },
      {
        id: "button-group",
        label: "Button Group",
        importPath: "@/components/ui/button-group",
      },
      { id: "toggle", label: "Toggle", importPath: "@/components/ui/toggle" },
      {
        id: "toggle-group",
        label: "Toggle Group",
        importPath: "@/components/ui/toggle-group",
      },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    items: [
      {
        id: "calendar",
        label: "Calendar",
        importPath: "@/components/ui/calendar",
      },
      {
        id: "checkbox",
        label: "Checkbox",
        importPath: "@/components/ui/checkbox",
      },
      {
        id: "combobox",
        label: "Combobox",
        importPath: "@/components/ui/combobox",
      },
      { id: "field", label: "Field", importPath: "@/components/ui/field" },
      { id: "input", label: "Input", importPath: "@/components/ui/input" },
      {
        id: "input-group",
        label: "Input Group",
        importPath: "@/components/ui/input-group",
      },
      {
        id: "input-otp",
        label: "Input OTP",
        importPath: "@/components/ui/input-otp",
      },
      { id: "label", label: "Label", importPath: "@/components/ui/label" },
      {
        id: "native-select",
        label: "Native Select",
        importPath: "@/components/ui/native-select",
      },
      {
        id: "radio-group",
        label: "Radio Group",
        importPath: "@/components/ui/radio-group",
      },
      { id: "select", label: "Select", importPath: "@/components/ui/select" },
      { id: "slider", label: "Slider", importPath: "@/components/ui/slider" },
      { id: "switch", label: "Switch", importPath: "@/components/ui/switch" },
      {
        id: "textarea",
        label: "Textarea",
        importPath: "@/components/ui/textarea",
      },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    items: [
      { id: "alert", label: "Alert", importPath: "@/components/ui/alert" },
      { id: "empty", label: "Empty", importPath: "@/components/ui/empty" },
      { id: "kbd", label: "Kbd", importPath: "@/components/ui/kbd" },
      {
        id: "progress",
        label: "Progress",
        importPath: "@/components/ui/progress",
      },
      {
        id: "skeleton",
        label: "Skeleton",
        importPath: "@/components/ui/skeleton",
      },
      {
        id: "spinner",
        label: "Spinner",
        importPath: "@/components/ui/spinner",
      },
      { id: "sonner", label: "Sonner", importPath: "@/components/ui/sonner" },
    ],
  },
  {
    id: "overlays",
    label: "Overlays",
    items: [
      {
        id: "command",
        label: "Command",
        importPath: "@/components/ui/command",
      },
      {
        id: "context-menu",
        label: "Context Menu",
        importPath: "@/components/ui/context-menu",
      },
      { id: "dialog", label: "Dialog", importPath: "@/components/ui/dialog" },
      { id: "drawer", label: "Drawer", importPath: "@/components/ui/drawer" },
      {
        id: "dropdown-menu",
        label: "Dropdown Menu",
        importPath: "@/components/ui/dropdown-menu",
      },
      {
        id: "hover-card",
        label: "Hover Card",
        importPath: "@/components/ui/hover-card",
      },
      {
        id: "popover",
        label: "Popover",
        importPath: "@/components/ui/popover",
      },
      { id: "sheet", label: "Sheet", importPath: "@/components/ui/sheet" },
      {
        id: "tooltip",
        label: "Tooltip",
        importPath: "@/components/ui/tooltip",
      },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    items: [
      {
        id: "breadcrumb",
        label: "Breadcrumb",
        importPath: "@/components/ui/breadcrumb",
      },
      {
        id: "menubar",
        label: "Menubar",
        importPath: "@/components/ui/menubar",
      },
      {
        id: "navigation-menu",
        label: "Navigation Menu",
        importPath: "@/components/ui/navigation-menu",
      },
      {
        id: "pagination",
        label: "Pagination",
        importPath: "@/components/ui/pagination",
      },
      {
        id: "sidebar",
        label: "Sidebar",
        importPath: "@/components/ui/sidebar",
      },
      { id: "tabs", label: "Tabs", importPath: "@/components/ui/tabs" },
    ],
  },
  {
    id: "data-display",
    label: "Data Display",
    items: [
      {
        id: "aspect-ratio",
        label: "Aspect Ratio",
        importPath: "@/components/ui/aspect-ratio",
      },
      { id: "avatar", label: "Avatar", importPath: "@/components/ui/avatar" },
      { id: "card", label: "Card", importPath: "@/components/ui/card" },
      {
        id: "carousel",
        label: "Carousel",
        importPath: "@/components/ui/carousel",
      },
      { id: "chart", label: "Chart", importPath: "@/components/ui/chart" },
      {
        id: "collapsible",
        label: "Collapsible",
        importPath: "@/components/ui/collapsible",
      },
      { id: "item", label: "Item", importPath: "@/components/ui/item" },
      {
        id: "scroll-area",
        label: "Scroll Area",
        importPath: "@/components/ui/scroll-area",
      },
      {
        id: "separator",
        label: "Separator",
        importPath: "@/components/ui/separator",
      },
      { id: "table", label: "Table", importPath: "@/components/ui/table" },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    items: [
      {
        id: "direction",
        label: "Direction",
        importPath: "@/components/ui/direction",
      },
      {
        id: "resizable",
        label: "Resizable",
        importPath: "@/components/ui/resizable",
      },
    ],
  },
]
