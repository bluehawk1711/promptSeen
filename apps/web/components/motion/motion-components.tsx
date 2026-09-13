'use client'

import { type ReactNode, type ComponentType } from 'react'
import { motion, type Variants, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'

// ─── Easing Presets ──────────────────────────────────────────────────────────

const EASE = {
  smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  snappy: [0.2, 0, 0, 1] as [number, number, number, number],
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  gentle: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const

// ─── FadeIn ──────────────────────────────────────────────────────────────────

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  delay?: number
  duration?: number
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  distance = 20,
  direction = 'up',
  className,
  ...props
}: FadeInProps) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: EASE.smooth }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerContainer ────────────────────────────────────────────────────────

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  staggerDelay?: number
  delayChildren?: number
}

export function StaggerContainer({
  children,
  staggerDelay = 0.06,
  delayChildren = 0,
  className,
  ...props
}: StaggerContainerProps) {
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerItem ─────────────────────────────────────────────────────────────

interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
}

export function StaggerItem({
  children,
  direction = 'up',
  distance = 16,
  className,
  ...props
}: StaggerItemProps) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...directionMap[direction] },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.45, ease: EASE.smooth },
    },
  }

  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

// ─── ScaleIn ─────────────────────────────────────────────────────────────────

interface ScaleInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  delay?: number
  duration?: number
  from?: number
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.4,
  from = 0.92,
  className,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: from }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration, delay, ease: EASE.bounce }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── SlideReveal ─────────────────────────────────────────────────────────────

interface SlideRevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  delay?: number
  direction?: 'left' | 'right' | 'up' | 'down'
}

export function SlideReveal({
  children,
  delay = 0,
  direction = 'left',
  className,
  ...props
}: SlideRevealProps) {
  const clipPathMap = {
    left: 'inset(0 100% 0 0)',
    right: 'inset(0 0 0 100%)',
    up: 'inset(100% 0 0 0)',
    down: 'inset(0 0 100% 0)',
  }

  return (
    <motion.div
      initial={{ clipPath: clipPathMap[direction] }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 0.6, delay, ease: EASE.smooth }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

interface AnimatedCounterProps {
  value: number
  duration?: number
  delay?: number
  className?: string
  format?: (n: number) => string
}

export function AnimatedCounter({
  value,
  duration = 1.2,
  delay = 0,
  className,
  format = (n) => n.toLocaleString(),
}: AnimatedCounterProps) {
  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
      >
        {format(value)}
      </motion.span>
    </motion.span>
  )
}

// ─── HoverCard ───────────────────────────────────────────────────────────────

interface HoverCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
}

export function HoverCard({ children, className, ...props }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgb(0 0 0 / 0.06)' }}
      transition={{ duration: 0.2, ease: EASE.gentle }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── Pressable ───────────────────────────────────────────────────────────────

interface PressableProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
}

export function Pressable({ children, className, ...props }: PressableProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: EASE.gentle }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── AnimatedTableRow ────────────────────────────────────────────────────────

interface AnimatedTableRowProps {
  children: ReactNode
  index?: number
  className?: string
}

export function AnimatedTableRow({ children, index = 0, className }: AnimatedTableRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: EASE.smooth,
      }}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        className,
      )}
    >
      {children}
    </motion.tr>
  )
}

// ─── AnimatedIcon ────────────────────────────────────────────────────────────

interface AnimatedIconProps {
  icon: ComponentType<{ size?: number; className?: string }>
  className?: string
  animate?: 'spin' | 'pulse' | 'bounce' | 'none'
  size?: number
}

export function AnimatedIcon({
  icon: Icon,
  className,
  animate = 'none',
  size = 16,
}: AnimatedIconProps) {
  const animationClass = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    none: '',
  }[animate]

  return (
    <motion.span
      whileHover={{ scale: 1.15, rotate: 5 }}
      transition={{ duration: 0.2, ease: EASE.bounce }}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <Icon size={size} className={animationClass} />
    </motion.span>
  )
}

// ─── PageTransition ──────────────────────────────────────────────────────────

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── FadeStatus ──────────────────────────────────────────────────────────────

interface FadeStatusProps {
  show: boolean
  children: ReactNode
  className?: string
}

export function FadeStatus({ show, children, className }: FadeStatusProps) {
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, height: 'auto', marginBottom: 0 } : { opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, ease: EASE.smooth }}
      className={cn('overflow-hidden', className)}
    >
      {children}
    </motion.div>
  )
}

// ─── LoadingDots ─────────────────────────────────────────────────────────────

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
