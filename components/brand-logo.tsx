import Image from "next/image"
import type { CSSProperties } from "react"

type BrandLogoVariant = "icon" | "lockup" | "wordmark"
type BrandLogoTone = "default" | "inverse"

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
  tone?: BrandLogoTone
  className?: string
  priority?: boolean
  decorative?: boolean
  style?: CSSProperties
}

export function BrandLogo({
  variant = "icon",
  tone = "default",
  className,
  priority = false,
  decorative = false,
  style,
}: BrandLogoProps) {
  const asset = brandAssets[variant]
  // The supplied inverse WebP is not decodable in Chromium. The canonical
  // full-color icon is transparent and retains strong contrast on both dark
  // and light surfaces, so inverse placements safely reuse the exact asset.
  const src = asset.src

  return (
    <Image
      src={src}
      width={asset.width}
      height={asset.height}
      sizes={asset.sizes}
      alt={decorative ? "" : "Student.social"}
      aria-hidden={decorative || undefined}
      data-tone={tone}
      className={className}
      style={style}
      priority={priority}
    />
  )
}
