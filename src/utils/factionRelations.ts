import type { Customer, Seat, StoryBranch, CalcResult, Faction } from '@/types'
import { FACTION_MAP, getFactionRelation } from '@/data/factions'

function areSeatsAdjacent(seat1: Seat, seat2: Seat): boolean {
  const dx = Math.abs(seat1.x - seat2.x)
  const dy = Math.abs(seat1.y - seat2.y)
  return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0)
}

export function calcFactionHarmony(
  customers: Customer[],
  seats: Seat[]
): CalcResult {
  const seatedCustomers = customers.filter((c) => c.seatId !== null)
  const details: Record<string, number> = {}
  let harmonyScore = 0
  let harmonyPairs = 0
  let conflictPairs = 0

  for (let i = 0; i < seatedCustomers.length; i++) {
    for (let j = i + 1; j < seatedCustomers.length; j++) {
      const c1 = seatedCustomers[i]
      const c2 = seatedCustomers[j]
      const seat1 = seats.find((s) => s.id === c1.seatId)
      const seat2 = seats.find((s) => s.id === c2.seatId)

      if (!seat1 || !seat2) continue
      if (!areSeatsAdjacent(seat1, seat2)) continue

      if (!c1.faction || !c2.faction) continue

      const relation = getFactionRelation(c1.faction, c2.faction)

      if (relation === 'allied') {
        harmonyScore += 15
        harmonyPairs++
      } else if (relation === 'opposed') {
        harmonyScore -= 20
        conflictPairs++
      } else {
        harmonyScore += 3
      }
    }
  }

  const totalPairs = harmonyPairs + conflictPairs
  if (totalPairs > 0) {
    details['友好阵营相邻'] = harmonyPairs
    details['敌对阵营相邻'] = conflictPairs
  }

  const finalScore = Math.max(0, Math.min(100, 50 + harmonyScore))
  details['阵营和谐度'] = finalScore

  return { value: finalScore, details }
}

export function calcFactionSatisfactionImpact(
  customers: Customer[],
  seats: Seat[]
): { customers: Customer[]; harmonyBonus: number; conflictPenalty: number } {
  const seatedCustomers = [...customers]
  let harmonyBonus = 0
  let conflictPenalty = 0

  for (let i = 0; i < seatedCustomers.length; i++) {
    const c1 = seatedCustomers[i]
    if (c1.seatId === null || !c1.faction) continue

    const seat1 = seats.find((s) => s.id === c1.seatId)
    if (!seat1) continue

    let satDelta = 0

    for (let j = 0; j < seatedCustomers.length; j++) {
      if (i === j) continue
      const c2 = seatedCustomers[j]
      if (c2.seatId === null || !c2.faction) continue

      const seat2 = seats.find((s) => s.id === c2.seatId)
      if (!seat2) continue
      if (!areSeatsAdjacent(seat1, seat2)) continue

      const relation = getFactionRelation(c1.faction, c2.faction)

      if (relation === 'allied') {
        satDelta += 3
        harmonyBonus += 5
      } else if (relation === 'opposed') {
        satDelta -= 5
        conflictPenalty += 8
      }
    }

    seatedCustomers[i] = {
      ...c1,
      satisfaction: Math.max(0, Math.min(100, c1.satisfaction + satDelta)),
    }
  }

  return {
    customers: seatedCustomers,
    harmonyBonus: Math.round(harmonyBonus / 2),
    conflictPenalty: Math.round(conflictPenalty / 2),
  }
}

export function calcStoryFactionImpact(
  branch: StoryBranch
): Record<Faction, number> {
  const deltas: Record<Faction, number> = {
    书院: 0,
    镖局: 0,
    商会: 0,
    衙门: 0,
  }

  const allTags = branch.tags

  for (const faction of Object.keys(deltas) as Faction[]) {
    const factionInfo = FACTION_MAP[faction]
    let delta = 0

    for (const tag of allTags) {
      if (factionInfo.likesTags.includes(tag)) {
        delta += 3
      }
      if (factionInfo.dislikesTags.includes(tag)) {
        delta -= 4
      }
    }

    deltas[faction] = delta
  }

  return deltas
}

export function getFactionSeatDistance(
  customers: Customer[],
  seats: Seat[],
  faction1: Faction,
  faction2: Faction
): number {
  const f1Customers = customers.filter((c) => c.faction === faction1 && c.seatId !== null)
  const f2Customers = customers.filter((c) => c.faction === faction2 && c.seatId !== null)

  if (f1Customers.length === 0 || f2Customers.length === 0) return Infinity

  let minDist = Infinity

  for (const c1 of f1Customers) {
    const s1 = seats.find((s) => s.id === c1.seatId)
    if (!s1) continue
    for (const c2 of f2Customers) {
      const s2 = seats.find((s) => s.id === c2.seatId)
      if (!s2) continue
      const dist = Math.abs(s1.x - s2.x) + Math.abs(s1.y - s2.y)
      if (dist < minDist) minDist = dist
    }
  }

  return minDist
}
