"use client"

import * as React from "react"

type MotionState = Record<string, unknown>

type MotionProps<T extends HTMLElement> = React.HTMLAttributes<T> & {
  initial?: MotionState | false
  animate?: MotionState
  exit?: MotionState
  transition?: MotionState
  whileHover?: MotionState
  whileTap?: MotionState
  layoutId?: string
}

function toCssValue(value: unknown) {
  return typeof value === "number" ? `${value}px` : String(value)
}

function motionStyle(state?: MotionState | false): React.CSSProperties {
  if (!state) return {}

  const transforms: string[] = []
  const style: React.CSSProperties = {}

  if (state.opacity !== undefined) style.opacity = Number(state.opacity)
  if (state.filter !== undefined) style.filter = String(state.filter)
  if (state.y !== undefined) transforms.push(`translateY(${toCssValue(state.y)})`)
  if (state.x !== undefined) transforms.push(`translateX(${toCssValue(state.x)})`)
  if (state.scale !== undefined) transforms.push(`scale(${state.scale})`)

  if (transforms.length) style.transform = transforms.join(" ")

  return style
}

function transitionStyle(transition?: MotionState): React.CSSProperties {
  const duration = typeof transition?.duration === "number" ? transition.duration : 0.28
  return {
    transitionProperty: "opacity, transform, filter",
    transitionDuration: `${duration}s`,
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
  }
}

function createMotionComponent<T extends HTMLElement, P extends React.HTMLAttributes<T>>(Tag: keyof React.JSX.IntrinsicElements) {
  return React.forwardRef<T, P & MotionProps<T>>(function MotionComponent(
    {
      initial,
      animate,
      exit: _exit,
      transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      layoutId: _layoutId,
      style,
      ...props
    },
    ref,
  ) {
    const [appliedStyle, setAppliedStyle] = React.useState<React.CSSProperties>(() =>
      initial === false ? motionStyle(animate) : motionStyle(initial),
    )

    React.useEffect(() => {
      if (!animate) return
      const frame = window.requestAnimationFrame(() => setAppliedStyle(motionStyle(animate)))
      return () => window.cancelAnimationFrame(frame)
    }, [animate])

    return React.createElement(Tag, {
      ...props,
      ref,
      style: {
        ...transitionStyle(transition),
        ...appliedStyle,
        ...style,
      },
    })
  })
}

export const motion = {
  div: createMotionComponent<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>("div"),
  span: createMotionComponent<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>("span"),
  li: createMotionComponent<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>("li"),
  nav: createMotionComponent<HTMLElement, React.HTMLAttributes<HTMLElement>>("nav"),
  section: createMotionComponent<HTMLElement, React.HTMLAttributes<HTMLElement>>("section"),
}

export function AnimatePresence({ children }: { children: React.ReactNode; mode?: "sync" | "wait" | "popLayout" }) {
  return <>{children}</>
}
