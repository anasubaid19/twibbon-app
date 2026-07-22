"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ComputerSettingsIcon, Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";

const THEME_OPTIONS = [
	{
		icon: (
			<HugeiconsIcon icon={ComputerSettingsIcon} strokeWidth={2} />
		),
		value: "system",
	},
	{
		icon: (
			<HugeiconsIcon icon={Sun01Icon} strokeWidth={2} />
		),
		value: "light",
	},
	{
		icon: (
			<HugeiconsIcon icon={Moon02Icon} strokeWidth={2} />
		),
		value: "dark",
	},
];

export function ToggleTheme() {
	const { theme, setTheme } = useTheme();

	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return <div className="flex h-8 w-24" />;
	}

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="inline-flex items-center overflow-hidden"
			initial={{ opacity: 0 }}
			key={String(isMounted)}
			role="radiogroup"
			transition={{ duration: 0.3 }}
		>
			{THEME_OPTIONS.map((option) => (
				<button
					aria-label={`Switch to ${option.value} theme`}
					className={cn(
						"relative flex size-7 cursor-pointer items-center justify-center rounded-md",
						"[&>svg]:size-3.5",
						theme === option.value
							? "text-foreground"
							: "text-muted-foreground hover:text-foreground"
					)}
					key={option.value}
					onClick={() => setTheme(option.value)}
					type="button"
				>
					{theme === option.value && (
						<motion.div
							className="absolute inset-0 rounded-md border border-muted-foreground/50"
							layoutId="theme-option"
							transition={{ type: "spring", bounce: 0.1, duration: 0.75 }}
						/>
					)}
					{option.icon}
				</button>
			))}
		</motion.div>
	);
}
