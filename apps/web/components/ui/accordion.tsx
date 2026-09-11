'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type AccordionContextValue = {
  type: 'single' | 'multiple'
  value: string[]
  onValueChange: (value: string[]) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

type AccordionItemContextValue = {
  value: string
  isOpen: boolean
  onToggle: () => void
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

function useAccordionContext() {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error('Accordion components must be used within <Accordion>')
  return ctx
}

function useAccordionItemContext() {
  const ctx = React.useContext(AccordionItemContext)
  if (!ctx) throw new Error('AccordionItem must be used within <Accordion>')
  return ctx
}

function Accordion({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange: onControlledChange,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  type?: 'single' | 'multiple'
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}) {
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue ?? [])
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const onValueChange = React.useCallback((next: string[]) => {
    if (!isControlled) setInternalValue(next)
    onControlledChange?.(next)
  }, [isControlled, onControlledChange])

  return (
    <AccordionContext.Provider value={{ type, value, onValueChange }}>
      <div className={cn('space-y-2', className)} {...props}>{children}</div>
    </AccordionContext.Provider>
  )
}

function AccordionItem({
  value: itemValue,
  disabled,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string
  disabled?: boolean
}) {
  const { type, value, onValueChange } = useAccordionContext()
  const isOpen = value.includes(itemValue)

  const onToggle = React.useCallback(() => {
    if (disabled) return
    if (type === 'single') {
      onValueChange(isOpen ? [] : [itemValue])
    } else {
      onValueChange(isOpen ? value.filter((v) => v !== itemValue) : [...value, itemValue])
    }
  }, [type, isOpen, itemValue, value, onValueChange, disabled])

  return (
    <AccordionItemContext.Provider value={{ value: itemValue, isOpen, onToggle }}>
      <div
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('border rounded-xl overflow-hidden', isOpen && 'border-border', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, onToggle } = useAccordionItemContext()

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between py-4 px-5 text-sm font-semibold text-left transition-colors hover:bg-muted/50 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isOpen } = useAccordionItemContext()

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
        className,
      )}
      {...props}
    >
      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
