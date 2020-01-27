import { RouteContext } from '../types'

//
// GET /data/labels ~ get all labels
//
export default async ({ sendData, redis }: RouteContext) => {
  // Grab the cards and labels from redis
  const cards = await redis.getJson('cards')
  const labels = await redis.getJson('labels')

  // Build a set of label ids that have been used
  const usedLabels = new Set<string>()

  for (const card of cards) {
    for (const labelId of card.idLabels) {
      usedLabels.add(labelId)
    }
  }

  // Send back the labels which have been used by at least one card
  sendData(labels.filter((label: any) => usedLabels.has(label.id)))
}
