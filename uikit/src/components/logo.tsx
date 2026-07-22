import * as React from "react"

function LogoSvg(props: React.ComponentProps<"svg">) {
  const uid = React.useId().replace(/:/g, "")
  const paint0 = `logo-paint0-${uid}`
  const paint1 = `logo-paint1-${uid}`

  return (
    <svg
      fill="none"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect fill="var(--logo-surface)" height="512" rx="100" width="512" />
      <rect fill={`url(#${paint0})`} height="512" rx="100" width="512" />
      <rect
        height="508.5"
        rx="98.25"
        stroke={`url(#${paint1})`}
        strokeOpacity="var(--logo-stroke-opacity)"
        strokeWidth="3.5"
        width="508.5"
        x="1.75"
        y="1.75"
      />
      <path
        d="M301.972 119H118V301.11H301.972V119Z"
        fill="var(--logo-mark-primary)"
      />
      <path
        d="M393.585 119.186H301.972V209.31H393.585V119.186Z"
        fill="var(--logo-mark-secondary)"
      />
      <path
        d="M301.972 209.869H210.358V301.296H301.972V209.869Z"
        fill="var(--logo-mark-tertiary)"
      />
      <path
        d="M210.359 301.669H118V393.841H210.359V301.669Z"
        fill="var(--logo-mark-tertiary)"
        opacity="0.85"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={paint0}
          x1="256"
          x2="256"
          y1="0"
          y2="512"
        >
          <stop stopColor="var(--logo-surface-gradient-start)" />
          <stop offset="1" stopColor="var(--logo-surface-gradient-end)" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={paint1}
          x1="0"
          x2="512"
          y1="0"
          y2="512"
        >
          <stop stopColor="var(--logo-border)" />
          <stop
            offset="0.302885"
            stopColor="var(--logo-border)"
            stopOpacity="0.2"
          />
          <stop
            offset="0.697115"
            stopColor="var(--logo-border)"
            stopOpacity="0.2"
          />
          <stop offset="1" stopColor="var(--logo-border)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const LogoIcon = (props: React.ComponentProps<"svg">) => (
  <LogoSvg aria-hidden {...props} />
)

export const Logo = (props: React.ComponentProps<"svg">) => (
  <LogoSvg aria-hidden {...props} />
)
