import { useId, type SVGProps } from 'react'

export function PSLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect width="40" height="40" rx="10" fill="var(--primary)" />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="var(--primary-foreground)"
        fontSize="18"
        fontWeight="700"
        fontFamily="DM Sans, sans-serif"
      >
        PS
      </text>
    </svg>
  )
}
