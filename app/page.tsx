import Link from "next/link"
import { Users, Coins, ArrowRight } from "lucide-react"
import { getBets } from "@/lib/actions"
import { formatCOP } from "@/lib/format"
import { SiteHeader } from "@/components/site-header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const bets = await getBets()

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="mb-8">
          <h1 className="text-2xl font-bold text-balance sm:text-3xl">
            Apuestas para Colombia
          </h1>
          <p className="mt-2 max-w-prose text-pretty leading-relaxed text-muted-foreground">
            Escribe tu nombre y se te asigna un marcador.
          </p>
        </section>

        {bets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Todavía no hay apuestas
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {bets.map((bet) => {
              const pot = Number(bet.entry_value) * bet.participant_count
              const spotsLeft = bet.total_scores - bet.participant_count
              const isOpen = bet.status === "open" && spotsLeft > 0
              return (
                <li key={bet.id}>
                  <Link href={`/bet/${bet.id}`} className="block h-full">
                    <Card className="h-full transition-colors hover:border-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg text-balance">
                            Colombia vs {bet.opponent}
                          </CardTitle>
                          {bet.status === "finished" ? (
                            <Badge variant="secondary">Finalizada</Badge>
                          ) : isOpen ? (
                            <Badge>Abierta</Badge>
                          ) : (
                            <Badge variant="outline">Llena</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Coins className="size-4 text-accent-foreground" aria-hidden="true" />
                          <span>
                            valor {formatCOP(Number(bet.entry_value))} · total{" "}
                            <span className="font-semibold text-foreground">
                              {formatCOP(pot)}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Users className="size-4" aria-hidden="true" />
                            {bet.participant_count} / {bet.total_scores}{" "}
                            jugadores
                          </span>
                          <span className="flex items-center gap-1 font-medium text-primary">
                            Ver <ArrowRight className="size-4" aria-hidden="true" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
