import { getAdminBets } from "@/lib/actions"
import { SiteHeader } from "@/components/site-header"
import { CreateBetForm } from "@/components/create-bet-form"
import { AdminBetCard } from "@/components/admin-bet-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const bets = await getAdminBets()

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Panel de administración</h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
          Crea apuestas, define el valor de entrada y los marcadores posibles.
          Cuando termine el partido, publica el resultado real para definir al
          ganador del pozo.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Nueva apuesta</CardTitle>
              <CardDescription>Colombia vs el equipo que elijas.</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateBetForm />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Apuestas existentes</h2>
            {bets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no has creado ninguna apuesta.
              </p>
            ) : (
              bets.map((bet) => (
                <AdminBetCard key={bet.id} bet={bet} scores={bet.scores} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
