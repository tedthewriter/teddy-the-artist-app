import { supabase } from './supabase'
import { accountBookStore } from './accountBookStores'
import { disneyCharacterSections } from '../data/disneyCharacters'
import { pixarCharacterSections } from '../data/pixarCharacters'
import { disneyLectureSections, disneyLectureSectionsTwo } from '../data/disneyLectures'
import { smallAcrylicPaintingSections } from '../data/smallAcrylicPaintings'
import { moreSmallAcrylicPaintingSections } from '../data/moreSmallAcrylicPaintings'
import { watercolorPaintingSections } from '../data/watercolorPaintings'

// Import every book and retry queued offline changes when the app opens,
// even if that book's page isn't visited.
export async function importBookProgress(userId) {
  if (!userId || !supabase) return
  const books = [
    ['disney-characters', 'teddy-disney-characters-v1', disneyCharacterSections],
    ['pixar', 'teddy-pixar-characters-v1', pixarCharacterSections],
    ['disney-lectures-one', 'teddy-disney-lectures-volume-one-v1', disneyLectureSections],
    ['disney-lectures-two', 'teddy-disney-lectures-volume-two-v1', disneyLectureSectionsTwo],
    ['small-acrylic', 'teddy-small-acrylic-paintings-v1', smallAcrylicPaintingSections],
    ['more-small-acrylic', 'teddy-more-small-acrylic-paintings-v1', moreSmallAcrylicPaintingSections],
    ['watercolor', 'teddy-watercolor-paintings-v1', watercolorPaintingSections],
  ]
  await Promise.allSettled(books.map(async ([bookId, prefix, sections]) => {
    const key = `${prefix}:${userId}`
    const valid = sections.flatMap(s => (s.lectures || s.paintings).map(p => p.number))
    await accountBookStore(userId, bookId, key, valid).sync()
  }))
}
