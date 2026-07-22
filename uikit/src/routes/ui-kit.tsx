import { createFileRoute } from "@tanstack/react-router"
import { UiKitPage } from "@/components/ui-kit/ui-kit-page"

export const Route = createFileRoute("/ui-kit")({ component: UiKitPage })
