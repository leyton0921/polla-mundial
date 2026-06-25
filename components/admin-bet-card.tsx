"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import {
  setResult,
  reopenBet,
  deleteBet,
  type BetSummary,
} from "@/lib/actions"
import { formatCOP } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminBetCard({
  bet,
  scores,
}: {
  bet: BetSummary
  scores: string[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string>(bet.real_score ?? "")
  const pot = Number(bet.entry_value) * bet.participant_count

  function run(fn: (fd: FormData) => Promise<any>, fd: FormData) {
    startTransition(async () => {
      await fn(fd)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-balance">
            Colombia vs {bet.opponent}
          </CardTitle>
          {bet.status === "finished" ? (
            <Badge variant="secondary">Finalizada</Badge>
          ) : (
            <Badge>Abierta</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {bet.participant_count}/{bet.total_scores} jugadores · Pozo{" "}
          {formatCOP(pot)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {bet.status === "open" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Definir marcador real</label>
            <div className="flex flex-wrap gap-2">
              {scores.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Sin marcadores.
                </span>
              ) : (
                scores.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelected(s)}
                    className={`rounded-md border px-3 py-1 text-sm tabular-nums transition-colors ${
                      selected === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))
              )}
            </div>
            <Button
              size="sm"
              disabled={isPending || !selected}
              onClick={() => {
                const fd = new FormData()
                fd.set("betId", String(bet.id))
                fd.set("realScore", selected)
                run(setResult, fd)
              }}
            >
              Cerrar y publicar resultado
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm">
              Resultado:{" "}
              <span className="font-semibold tabular-nums">
                {bet.real_score}
              </span>
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                const fd = new FormData()
                fd.set("betId", String(bet.id))
                run(reopenBet, fd)
              }}
            >
              Reabrir
            </Button>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => {
            if (!confirm("¿Eliminar esta apuesta y todos sus registros?")) return
            const fd = new FormData()
            fd.set("betId", String(bet.id))
            run(deleteBet, fd)
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" /> Eliminar
        </Button>
      </CardContent>
    </Card>
  )
}
