import type {
  Customer,
  Story,
  StoryBranch,
  Seat,
  Renovation,
  StoryRecord,
  SettlementResult,
  Snack,
  Faction,
} from '@/types'
import { calcAvgTasteMatch } from './tasteMatch'
import { calcAvgSeatView } from './seatView'
import { calcStoryHeat } from './storyHeat'
import { calcSerialExpect } from './serialExpect'
import { calcBadReview, calcBadReviewGold } from './badReview'
import { calcFactionSatisfactionImpact, calcStoryFactionImpact } from './factionRelations'
import { SEAT_PRICE_MULTIPLIER } from '@/data/seats'

export function calcSettlement(
  day: number,
  story: Story,
  branch: StoryBranch,
  customers: Customer[],
  seats: Seat[],
  renovations: Renovation[],
  history: StoryRecord[],
  lastStoryDay: Record<string, number>,
  storyScores: Record<string, number[]>,
  reputation: number,
  snacks: Snack[]
): SettlementResult {
  const factionImpact = calcFactionSatisfactionImpact(customers, seats)
  const adjustedCustomers = factionImpact.customers
  const factionHarmonyBonus = factionImpact.harmonyBonus
  const factionConflictPenalty = factionImpact.conflictPenalty

  const audience = adjustedCustomers.filter((c) => c.seatId !== null)
  const audienceCount = audience.length

  const taste = calcAvgTasteMatch(audience, branch)
  const view = calcAvgSeatView(seats, renovations)
  const heat = calcStoryHeat(story, branch, history, reputation)
  const expect = calcSerialExpect(story.id, day, lastStoryDay, storyScores)
  const badReview = calcBadReview(adjustedCustomers, reputation)

  let baseEarnings = 0
  for (const c of audience) {
    const seat = seats.find((s) => s.id === c.seatId)
    const seatMul = seat ? SEAT_PRICE_MULTIPLIER[seat.tier] : 1
    baseEarnings += Math.round(5 * seatMul)
  }

  const tasteMatchBonus = Math.round(baseEarnings * (taste.value / 100) * 0.8)
  const seatViewBonus = Math.round(baseEarnings * (view.value / 100) * 0.5)
  const storyHeatBonus = Math.round(baseEarnings * (heat.value / 100) * 0.7)
  const serialExpectBonus = Math.round(baseEarnings * (expect.value / 100) * 0.4)

  let tips = 0
  for (const c of audience) {
    const satFactor = c.satisfaction / 100
    const genFactor = c.generosity / 5
    tips += Math.round(c.wealth * satFactor * genFactor * 0.15)
  }

  const badReviewPenalty = calcBadReviewGold(adjustedCustomers)

  let snackRevenue = 0
  const consumedSnacks: Record<string, number> = {}
  for (const c of audience) {
    if (c.satisfaction > 50 && Math.random() < 0.6) {
      const available = snacks.filter((s) => s.stock > 0)
      if (available.length > 0) {
        const s = available[Math.floor(Math.random() * available.length)]
        snackRevenue += s.price - s.cost
        consumedSnacks[s.id] = (consumedSnacks[s.id] || 0) + 1
      }
    }
  }
  for (const [id, n] of Object.entries(consumedSnacks)) {
    const s = snacks.find((x) => x.id === id)
    if (s) s.stock = Math.max(0, s.stock - n)
  }

  const totalEarnings =
    baseEarnings +
    tasteMatchBonus +
    seatViewBonus +
    storyHeatBonus +
    serialExpectBonus +
    tips +
    snackRevenue +
    factionHarmonyBonus -
    badReviewPenalty -
    factionConflictPenalty

  const avgSatisfaction =
    audience.length > 0
      ? Math.round(audience.reduce((s, c) => s + c.satisfaction, 0) / audience.length)
      : 0

  const satisfactionDelta = Math.round((avgSatisfaction - 50) * 0.15)
  const heatDelta = Math.round((heat.value - 50) * 0.1)
  const badReviewDelta = -badReview.value
  const factionDelta = Math.round((factionHarmonyBonus - factionConflictPenalty) * 0.1)
  const reputationDelta = satisfactionDelta + heatDelta + badReviewDelta + factionDelta

  const factionDeltas = calcStoryFactionImpact(branch)
  const factionCustomerCount: Record<Faction, number> = {
    书院: 0,
    镖局: 0,
    商会: 0,
    衙门: 0,
  }
  for (const c of audience) {
    if (c.faction) {
      factionCustomerCount[c.faction]++
    }
  }
  for (const faction of Object.keys(factionDeltas) as Faction[]) {
    const count = factionCustomerCount[faction]
    if (count > 0) {
      factionDeltas[faction] = Math.round(factionDeltas[faction] * (1 + count * 0.2))
    }
  }

  return {
    day,
    audienceCount,
    baseEarnings,
    tasteMatchBonus,
    seatViewBonus,
    storyHeatBonus,
    serialExpectBonus,
    badReviewPenalty,
    tips,
    snackRevenue,
    factionHarmonyBonus,
    factionConflictPenalty,
    totalEarnings,
    reputationDelta,
    avgSatisfaction,
    factionDeltas,
  }
}
