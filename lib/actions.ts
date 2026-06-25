"use server"

import { pool, query } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type Bet = {
  id: number
  opponent: string
  entry_value: number
  status: "open" | "finished"
  real_score: string | null
  created_at: string
}

export type PossibleScore = {
  id: number
  bet_id: number
  score: string
  assigned: boolean
}

export type Participant = {
  id: number
  bet_id: number
  name: string
  score: string
  created_at: string
}

export type BetSummary = Bet & {
  participant_count: number
  total_scores: number
}

export type BetDetail = {
  bet: Bet
  scores: PossibleScore[]
  participants: Participant[]
  pot: number
  winners: Participant[]
}

// ---------- Admin ----------

export async function createBet(formData: FormData) {
  const opponent = String(formData.get("opponent") ?? "").trim()
  const entryValue = Number(formData.get("entryValue") ?? 0)
  const scoresRaw = String(formData.get("scores") ?? "")

  const scores = scoresRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (!opponent) return { error: "Escribe el equipo rival." }
  if (!Number.isFinite(entryValue) || entryValue <= 0)
    return { error: "El valor de entrada debe ser mayor a 0." }
  if (scores.length === 0)
    return { error: "Agrega al menos un marcador posible." }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const betRes = await client.query(
      `INSERT INTO bets (opponent, entry_value) VALUES ($1, $2) RETURNING id`,
      [opponent, entryValue],
    )
    const betId = betRes.rows[0].id
    for (const score of scores) {
      await client.query(
        `INSERT INTO possible_scores (bet_id, score) VALUES ($1, $2)`,
        [betId, score],
      )
    }
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    return { error: "No se pudo crear la apuesta." }
  } finally {
    client.release()
  }

  revalidatePath("/")
  revalidatePath("/admin")
  return { success: true }
}

export async function setResult(formData: FormData) {
  const betId = Number(formData.get("betId"))
  const realScore = String(formData.get("realScore") ?? "").trim()
  if (!betId || !realScore) return { error: "Selecciona el marcador real." }

  await query(
    `UPDATE bets SET real_score = $1, status = 'finished' WHERE id = $2`,
    [realScore, betId],
  )
  revalidatePath("/")
  revalidatePath(`/bet/${betId}`)
  revalidatePath("/admin")
  return { success: true }
}

export async function reopenBet(formData: FormData) {
  const betId = Number(formData.get("betId"))
  if (!betId) return { error: "Apuesta inválida." }
  await query(
    `UPDATE bets SET status = 'open', real_score = NULL WHERE id = $1`,
    [betId],
  )
  revalidatePath("/")
  revalidatePath(`/bet/${betId}`)
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteBet(formData: FormData) {
  const betId = Number(formData.get("betId"))
  if (!betId) return { error: "Apuesta inválida." }
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(`DELETE FROM participants WHERE bet_id = $1`, [betId])
    await client.query(`DELETE FROM possible_scores WHERE bet_id = $1`, [betId])
    await client.query(`DELETE FROM bets WHERE id = $1`, [betId])
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK")
    return { error: "No se pudo eliminar la apuesta." }
  } finally {
    client.release()
  }
  revalidatePath("/")
  revalidatePath("/admin")
  return { success: true }
}

// ---------- Participants ----------

export async function joinBet(formData: FormData) {
  const betId = Number(formData.get("betId"))
  const name = String(formData.get("name") ?? "").trim()
  if (!betId) return { error: "Apuesta inválida." }
  if (!name) return { error: "Escribe tu nombre." }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const betRes = await client.query(
      `SELECT id, status FROM bets WHERE id = $1 FOR UPDATE`,
      [betId],
    )
    if (betRes.rows.length === 0) {
      await client.query("ROLLBACK")
      return { error: "La apuesta no existe." }
    }
    if (betRes.rows[0].status !== "open") {
      await client.query("ROLLBACK")
      return { error: "Esta apuesta ya está cerrada." }
    }

    // Pick one random score that hasn't been assigned yet, locking the row.
    const scoreRes = await client.query(
      `SELECT id, score FROM possible_scores
       WHERE bet_id = $1 AND assigned = false
       ORDER BY random()
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
      [betId],
    )
    if (scoreRes.rows.length === 0) {
      await client.query("ROLLBACK")
      return { error: "Ya no quedan marcadores disponibles para esta apuesta." }
    }

    const { id: scoreId, score } = scoreRes.rows[0]
    await client.query(
      `UPDATE possible_scores SET assigned = true WHERE id = $1`,
      [scoreId],
    )
    const partRes = await client.query(
      `INSERT INTO participants (bet_id, name, score) VALUES ($1, $2, $3) RETURNING id`,
      [betId, name, score],
    )
    await client.query("COMMIT")

    revalidatePath("/")
    revalidatePath(`/bet/${betId}`)
    return { success: true, score, participantId: partRes.rows[0].id as number }
  } catch (e) {
    await client.query("ROLLBACK")
    return { error: "No se pudo registrar tu apuesta. Intenta de nuevo." }
  } finally {
    client.release()
  }
}

// ---------- Reads ----------

export async function getBets(): Promise<BetSummary[]> {
  return query<BetSummary>(
    `SELECT b.*,
       (SELECT COUNT(*)::int FROM participants p WHERE p.bet_id = b.id) AS participant_count,
       (SELECT COUNT(*)::int FROM possible_scores s WHERE s.bet_id = b.id) AS total_scores
     FROM bets b
     ORDER BY b.created_at DESC`,
  )
}

export async function getAdminBets(): Promise<
  (BetSummary & { scores: string[] })[]
> {
  const bets = await getBets()
  if (bets.length === 0) return []
  const ids = bets.map((b) => b.id)
  const rows = await query<{ bet_id: number; score: string }>(
    `SELECT bet_id, score FROM possible_scores
     WHERE bet_id = ANY($1::int[]) ORDER BY id ASC`,
    [ids],
  )
  return bets.map((b) => ({
    ...b,
    scores: rows.filter((r) => r.bet_id === b.id).map((r) => r.score),
  }))
}

export async function getBetDetail(betId: number): Promise<BetDetail | null> {
  const bets = await query<Bet>(`SELECT * FROM bets WHERE id = $1`, [betId])
  if (bets.length === 0) return null
  const bet = bets[0]

  const scores = await query<PossibleScore>(
    `SELECT * FROM possible_scores WHERE bet_id = $1 ORDER BY id ASC`,
    [betId],
  )
  const participants = await query<Participant>(
    `SELECT * FROM participants WHERE bet_id = $1 ORDER BY created_at ASC`,
    [betId],
  )

  const pot = Number(bet.entry_value) * participants.length
  const winners =
    bet.real_score != null
      ? participants.filter((p) => p.score === bet.real_score)
      : []

  return { bet, scores, participants, pot, winners }
}
