import { LogoCloud } from "@/components/logo-cloud" // @faiz/logo-cloud-9

export function LogosSection() {
  return (
    <section className="mx-auto h-full max-w-4xl px-4 py-10 md:px-8">
      <h2 className="text-subtitle mb-6 text-center">
        <span className="text-muted-foreground">
          Built with the tools
        </span>{" "}
        <span className="text-primary">you already love.</span>
      </h2>
      <LogoCloud />
    </section>
  )
}
