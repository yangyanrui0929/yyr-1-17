import type { FactionInfo, Faction } from '@/types'

export const FACTIONS: FactionInfo[] = [
  {
    id: '书院',
    name: '书院',
    description: '文人墨客聚集之地，崇尚学问与风雅',
    stance: '推崇儒家礼教，讲究仁义道德',
    taboo: '粗俗武斗、市井牟利',
    likesTags: ['历史', '诗词', '婉约', '才子佳人', '谋略'],
    dislikesTags: ['武侠', '热血', '讽刺', '江湖'],
    alliedFactions: ['衙门'],
    opposedFactions: ['镖局'],
    emoji: '📜',
    color: '#4A90D9',
  },
  {
    id: '镖局',
    name: '镖局',
    description: '江湖武林中人，重义气讲规矩',
    stance: '崇尚武力，以武会友，快意恩仇',
    taboo: '阴谋诡计、官场黑暗',
    likesTags: ['武侠', '热血', '江湖', '义气', '冒险'],
    dislikesTags: ['官场', '婉约', '讽刺', '世情'],
    alliedFactions: ['商会'],
    opposedFactions: ['书院'],
    emoji: '⚔️',
    color: '#D94A4A',
  },
  {
    id: '商会',
    name: '商会',
    description: '富商大贾的联盟，追求利益最大化',
    stance: '重利轻别离，生意场上无父子',
    taboo: '空谈仁义、武斗滋事',
    likesTags: ['历史', '谋略', '世情', '励志', '神怪'],
    dislikesTags: ['武侠', '热血', '婉约', '爱情'],
    alliedFactions: ['镖局'],
    opposedFactions: ['衙门'],
    emoji: '💰',
    color: '#D9A94A',
  },
  {
    id: '衙门',
    name: '衙门',
    description: '官府中人，代表朝廷的权威',
    stance: '维护礼法秩序，讲究官场规矩',
    taboo: '江湖私斗、讽刺官府',
    likesTags: ['历史', '谋略', '官场', '世情', '励志'],
    dislikesTags: ['武侠', '江湖', '讽刺', '神怪'],
    alliedFactions: ['书院'],
    opposedFactions: ['商会'],
    emoji: '🏛️',
    color: '#4AD98B',
  },
]

export const FACTION_MAP: Record<Faction, FactionInfo> = FACTIONS.reduce(
  (acc, f) => {
    acc[f.id] = f
    return acc
  },
  {} as Record<Faction, FactionInfo>
)

export const INITIAL_FACTION_SUPPORT: Record<Faction, number> = {
  书院: 30,
  镖局: 30,
  商会: 30,
  衙门: 30,
}

export function getFactionInfo(faction: Faction): FactionInfo {
  return FACTION_MAP[faction]
}

export function getFactionRelation(faction1: Faction, faction2: Faction): 'allied' | 'opposed' | 'neutral' {
  const f1 = FACTION_MAP[faction1]
  if (f1.alliedFactions.includes(faction2)) return 'allied'
  if (f1.opposedFactions.includes(faction2)) return 'opposed'
  return 'neutral'
}
