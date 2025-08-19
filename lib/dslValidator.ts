import { z } from 'zod'

export const TextNode = z.object({
  type: z.literal('text'),
  content: z.string(),
})

export const DocumentNode = z.object({
  type: z.literal('document'),
  children: z.array(TextNode),
})

export type DocumentSchema = z.infer<typeof DocumentNode>