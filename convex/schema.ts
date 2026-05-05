import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  todos: defineTable({
    userId: v.string(),
    localId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
    subtasks: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          completed: v.boolean(),
        })
      )
    ),
    attachments: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.union(v.literal('image'), v.literal('file')),
          uri: v.string(),
          name: v.string(),
          size: v.optional(v.number()),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    externalCalendarEventId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_local_id', ['userId', 'localId']),
});
