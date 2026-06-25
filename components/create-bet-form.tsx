"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBet } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CreateBetForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function action(formData: FormData) {
    setError(null)
    setOk(false)
    startTransition(async () => {
      const res = await createBet(formData)
      if (res?.error) {
        setError(res.error)
        return
      }
      if (res?.success) {
        setOk(true)
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="opponent">Equipo rival</Label>
        <Input
          id="opponent"
          name="opponent"
          placeholder="Ej. Brasil"
          required
          maxLength={60}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entryValue">Valor de entrada (COP)</Label>
        <Input
          id="entryValue"
          name="entryValue"
          type="number"
          min={1}
          step={1}
          placeholder="Ej. 10000"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="scores">Marcadores posibles</Label>
        <textarea
          id="scores"
          name="scores"
          required
          rows={4}
          placeholder={"Uno por línea o separados por coma:\n2-1, 1-0, 0-0, 3-1, 2-2"}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Cada marcador se asigna a una sola persona. El número de marcadores es
          el cupo máximo de jugadores.
        </p>
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="text-sm font-medium text-primary" role="status">
          ¡Apuesta creada!
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando..." : "Crear apuesta"}
      </Button>
    </form>
  )
}
