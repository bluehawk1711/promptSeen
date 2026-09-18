import Image from 'next/image'

export function PSLogo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      <Image
        src="/app_logo-transparent.png"
        alt="Prompt View"
        width={64}
        height={64}
        className="size-full rounded-lg object-contain"
        priority
      />
    </div>
  )
}
