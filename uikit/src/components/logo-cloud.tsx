"use client"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

type Logo = {
  src: string
  alt: string
}

const INTERVAL_DURATION = 1500
const MAX_LOGOS = 8

export function LogoCloud() {
  const initialLogos = logos.slice(0, MAX_LOGOS)
  const [displayedLogos, setDisplayedLogos] = useState<Logo[]>(initialLogos)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedLogos((currentDisplayed) => {
        // Create a copy of the current displayed logos
        const newDisplayed = [...currentDisplayed]

        // Randomly select 1-2 logos to change
        const numberOfLogosToChange = Math.floor(Math.random() * 2) + 1

        for (let i = 0; i < numberOfLogosToChange; i++) {
          // Get a random position to change
          const randomPosition = Math.floor(Math.random() * MAX_LOGOS)

          // Get available logos that aren't currently displayed
          const availableLogos = logos.filter(
            (logo) =>
              !newDisplayed.some((displayed) => displayed.src === logo.src)
          )

          // If we have available logos, swap one in
          if (availableLogos.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * availableLogos.length
            )
            const randomLogo = availableLogos[randomIndex]
            if (randomLogo) {
              newDisplayed[randomPosition] = randomLogo
            }
          }
        }

        return newDisplayed
      })
    }, INTERVAL_DURATION)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative grid w-full grid-cols-2 md:grid-cols-4">
      <AnimatePresence mode="popLayout">
        {displayedLogos.map((logo, index) => (
          <div
            className="flex h-16 items-center justify-center px-4 md:h-18 md:px-6"
            key={`${logo.src}-${index}`}
          >
            <LogoCard logo={logo} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const logoVariants = {
  hidden: {
    opacity: 0,
    y: -5,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    filter: "blur(4px)",
  },
}

function LogoCard({ logo }: { logo: Logo }) {
  return (
    <motion.div
      animate="visible"
      exit="exit"
      initial="hidden"
      transition={{
        duration: 0.3,
      }}
      variants={logoVariants}
    >
      <img
        alt={logo.alt}
        className="pointer-events-none h-4 w-fit select-none md:h-5 dark:brightness-0 dark:invert"
        height="auto"
        loading="lazy"
        src={logo.src}
        width="auto"
      />
    </motion.div>
  )
}

const logos = [
  {
    src: "https://storage.efferd.com/logo/vercel-wordmark.svg",
    alt: "Vercel Logo",
  },
  {
    src: "https://storage.efferd.com/logo/supabase-wordmark.svg",
    alt: "Supabase Logo",
  },
  {
    src: "https://storage.efferd.com/logo/stripe-wordmark.svg",
    alt: "Stripe Logo",
  },

  {
    src: "https://storage.efferd.com/logo/openai-wordmark.svg",
    alt: "OpenAI Logo",
  },
  {
    src: "https://storage.efferd.com/logo/turso-wordmark.svg",
    alt: "Turso Logo",
  },
  {
    src: "https://storage.efferd.com/logo/github-wordmark.svg",
    alt: "GitHub Logo",
  },
  {
    src: "https://storage.efferd.com/logo/claude-wordmark.svg",
    alt: "Claude AI Logo",
  },
  {
    src: "https://storage.efferd.com/logo/nvidia-wordmark.svg",
    alt: "Nvidia Logo",
  },
  {
    src: "https://storage.efferd.com/logo/clerk-wordmark.svg",
    alt: "Clerk Logo",
  },
  {
    src: "https://storage.efferd.com/logo/bolt-wordmark.svg",
    alt: "Bolt Logo",
  },
  {
    src: "https://storage.efferd.com/logo/dub-wordmark.svg",
    alt: "Dub Logo",
  },
  {
    src: "https://storage.efferd.com/logo/anthropic-wordmark.svg",
    alt: "Anthropic Logo",
  },
]
