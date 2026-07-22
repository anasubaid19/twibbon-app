import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { LinkedinIcon } from "@/components/linkedin-icon";
import { XIcon } from "@/components/x-icon";
import { YoutubeIcon } from "@/components/youtube-icon";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/indicator";
import { ToggleTheme } from "@/components/toggle-theme";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

const footerSections = [
	{
		title: "Product",
		links: [
			{ href: "#", label: "Components" },
			{ href: "#", label: "Blocks" },
			{ href: "#", label: "Templates" },
			{ href: "#", label: "Themes" },
			{ href: "#", label: "Pricing" },
		],
	},
	{
		title: "Resources",
		links: [
			{ href: "#", label: "Documentation", isExternal: true },
			{ href: "#", label: "Getting started", isExternal: true },
			{ href: "#", label: "Examples", isExternal: true },
			{ href: "#", label: "Figma kit" },
			{ href: "#", label: "Changelog" },
		],
	},
	{
		title: "Company",
		links: [
			{ href: "#", label: "About us" },
			{ href: "#", label: "Blog" },
			{ href: "#", label: "FAQs" },
			{ href: "#", label: "Contact" },
		],
	},
	{
		title: "Legal",
		links: [
			{ href: "#", label: "License", isExternal: true },
			{ href: "#", label: "Privacy policy", isExternal: true },
			{ href: "#", label: "Terms of service", isExternal: true },
		],
	},
];

// Social media links configuration with their respective icons
const socialLinks = [
	{
		icon: <XIcon />,
		href: "#",
		label: "X / Twitter",
	},
	{
		icon: <YoutubeIcon />,
		href: "#",
		label: "YouTube",
	},
	{
		icon: <LinkedinIcon />,
		href: "#",
		label: "LinkedIn",
	},
];

export function Footer() {
	return (
		<footer
			className={cn(
				"mx-auto max-w-5xl px-6 lg:px-8",
				// Radial gradient background for dark mode to give a premium feel
				"dark:bg-[radial-gradient(35%_128px_at_50%_0%,--theme(--color-foreground/.1),transparent)]"
			)}
		>
			<div className="h-px w-full bg-linear-to-r via-border" />

			{/* Main Grid */}
			<div className="grid grid-cols-2 gap-8 py-12 lg:grid-cols-6">
				{/* Brand Column */}
				<div className="col-span-2 pe-8">
					<Logo className="mb-5 h-5" />
					<p className="mb-6 text-muted-foreground text-sm leading-relaxed">
						A premium UI kit and boilerplate built on shadcn/ui and Tailwind CSS.
					</p>
					<p className="text-muted-foreground text-sm">
						Crafted for developers who{" "}
						<Link
							className="font-medium text-primary hover:underline"
							href="#"
							target="_blank"
						>
							ship fast.
						</Link>
					</p>
				</div>

				{/* Links Columns */}
				{footerSections.map((section) => (
					<div className="col-span-1" key={section.title}>
						<h3 className="mb-5 font-semibold text-sm">{section.title}</h3>
						<ul className="space-y-2.5 text-muted-foreground text-sm">
							{section.links.map((link) => (
								<li key={link.label}>
									<a
										className="group flex w-max items-center gap-0.5 hover:text-foreground"
										href={link.href}
										target={link.isExternal ? "_blank" : "_self"}
									>
										{link.label}
										{link.isExternal && (
											<HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-2.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
										)}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			<div className="h-px w-full bg-linear-to-r via-border" />

			{/* Middle Section: Theme toggle and Social media links */}
			<div className="flex flex-col justify-between gap-6 py-6 md:flex-row md:items-center">
				<div className="flex items-center gap-2">
					<span className="font-medium text-foreground text-sm">Theme:</span>
					<ToggleTheme />
				</div>

				<div className="flex items-center gap-2">
					<span className="font-medium text-foreground text-sm">
						Follow us on:
					</span>
					<div className="flex gap-1">
						{socialLinks.map(({ icon, href, label }) => (
							<Button className="text-muted-foreground hover:text-foreground" key={label} size="icon-sm" variant="ghost" render={<a aria-label={label} href={href} target="_blank" />} nativeButton={false}>{icon}</Button>
						))}
					</div>
				</div>
			</div>

			<div className="h-px w-full bg-linear-to-r via-border" />

			{/* Bottom Section: System status badge and Copyright */}
			<div className="flex flex-col justify-between gap-6 py-4 sm:flex-row sm:items-center">
				<Button size="sm" variant="ghost" render={<a href="#" />} nativeButton={false}><StatusIndicator className="text-primary" /><span className="text-xs">All Systems Normal</span></Button>

				<p className="text-muted-foreground text-sm">
					© {new Date().getFullYear()} Faiz UI. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
