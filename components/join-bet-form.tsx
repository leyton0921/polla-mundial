"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PartyPopper } from "lucide-react"
import { joinBet } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function JoinBetForm({ betId }: { betId: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assigned, setAssigned] = useState<string | null>(null)

  function action(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await joinBet(formData)
      if (res?.error) {
        setError(res.error)
        return
      }
      if (res?.success) {
        setAssigned(res.score ?? null)
        router.refresh()
      }
    })
  }

  if (assigned) {
    return (
      <div className="rounded-lg border border-primary bg-secondary p-6 text-center">
        <PartyPopper
          className="mx-auto mb-2 size-8 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Tu marcador es</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{assigned}</p>
        <p className="mt-3 text-sm text-pretty text-muted-foreground">
          ¡Mucha suerte! 
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="betId" value={betId} />
      <div className="space-y-2">
        <Label htmlFor="name">Tu nombre</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ej. Juan Pérez"
          required
          maxLength={60}
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Registrando..." : "Registrarme y recibir marcador"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Se te asignará un marcador 
      </p>
    </form>
  )
}
