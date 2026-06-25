import Link from "next/link"
import { Trophy } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold leading-tight text-balance">
            La Polla de Colombia
          </span>
        </Link>
        <Link
          href="/admin"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Panel admin
        </Link>
      </div>
    </header>
  )
}
