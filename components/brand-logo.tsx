import Image from "next/image"
import type { CSSProperties } from "react"

type BrandLogoVariant = "icon" | "lockup" | "wordmark"

const brandAssets = {
  icon: {
    src: "/brand/student-social-icon.webp",
    width: 256,
    height: 256,
    sizes: "(max-width: 768px) 40px, 48px",
  },
  lockup: {
    src: "/brand/student-social-lockup.webp",
    width: 512,
    height: 171,
    sizes: "(max-width: 768px) 180px, 220px",
  },
  wordmark: {
    src: "/brand/student-social-wordmark.webp",
    width: 512,
    height: 171,
    sizes: "(max-width: 768px) 160px, 220px",
  },
} as const

interface BrandLogoProps {
  variant?: BrandLogoVariant
  className?: string
  priority?: boolean
  decorative?: boolean
  style?: CSSProperties
}

export function BrandLogo({
  variant = "lockup",
  className,
  priority = false,
  decorative = false,
  style,
}: BrandLogoProps) {
  const asset = brandAssets[variant]

  return (
    <Image
      src={asset.src}
      width={asset.width}
      height={asset.height}
      sizes={asset.sizes}
      alt={decorative ? "" : "Student.social"}
      aria-hidden={decorative || undefined}
      className={className}
      style={style}
      priority={priority}
    />
  )
}
