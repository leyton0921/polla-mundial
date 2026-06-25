import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Coins, Users, Trophy, Crown } from "lucide-react"
import { getBetDetail } from "@/lib/actions"
import { formatCOP } from "@/lib/format"
import { SiteHeader } from "@/components/site-header"
import { JoinBetForm } from "@/components/join-bet-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function BetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const betId = Number(id)
  if (!Number.isFinite(betId)) notFound()

  const detail = await getBetDetail(betId)
  if (!detail) notFound()

  const { bet, scores, participants, pot, winners } = detail
  const spotsLeft = scores.length - participants.length
  const isOpen = bet.status === "open" && spotsLeft > 0
  const finished = bet.status === "finished"

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-balance sm:text-3xl">
              Colombia vs {bet.opponent}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrada por persona: {formatCOP(Number(bet.entry_value))}
            </p>
          </div>
          {finished ? (
            <Badge variant="secondary">Finalizada</Badge>
          ) : isOpen ? (
            <Badge>Abierta</Badge>
          ) : (
            <Badge variant="outline">Cupos llenos</Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <Coins className="size-7 text-accent-foreground" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Pozo total</p>
                <p className="text-xl font-bold">{formatCOP(pot)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <Users className="size-7 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Jugadores</p>
                <p className="text-xl font-bold">
                  {participants.length} / {scores.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-5">
              <Trophy className="size-7 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Marcador real</p>
                <p className="text-xl font-bold tabular-nums">
                  {bet.real_score ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {finished && (
          <Card className="mt-6 border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="size-5 text-accent-foreground" aria-hidden="true" />
                Resultado: {bet.real_score}
              </CardTitle>
              <CardDescription>
                {winners.length > 0
                  ? `¡Ganador${winners.length > 1 ? "es" : ""} del pozo de ${formatCOP(pot)}!`
                  : "Nadie acertó el marcador exacto esta vez."}
              </CardDescription>
            </CardHeader>
            {winners.length > 0 && (
              <CardContent className="flex flex-wrap gap-2">
                {winners.map((w) => (
                  <Badge key={w.id} className="text-sm">
                    {w.name} · {w.score}
                  </Badge>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isOpen ? "Registrar mi apuesta" : "Registro cerrado"}
              </CardTitle>
              <CardDescription>
                {isOpen
                  ? `Quedan ${spotsLeft} marcador${spotsLeft === 1 ? "" : "es"} por asignar.`
                  : finished
                    ? "Esta apuesta ya terminó."
                    : "Ya se asignaron todos los marcadores."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isOpen ? (
                <JoinBetForm betId={bet.id} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No es posible registrarse en esta apuesta.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
              <CardDescription>
                Cada persona tiene un marcador único.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aún no hay participantes. ¡Sé el primero!
                </p>
              ) : (
                <ul className="divide-y">
                  {participants.map((p) => {
                    const isWinner = finished && p.score === bet.real_score
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-2 py-2"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          {isWinner && (
                            <Crown
                              className="size-4 text-accent-foreground"
                              aria-hidden="true"
                            />
                          )}
                          {p.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {p.score}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
