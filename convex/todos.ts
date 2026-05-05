import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.tokenIdentifier;
}

const todoRecord = v.object({
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
});

export const list = query({
  args: {},
  handler: async ctx => {
    const userId = await requireUserId(ctx);
    const todos = await ctx.db
      .query('todos')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    return todos
      .map(todo => ({
        localId: todo.localId,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        priority: todo.priority,
        dueDate: todo.dueDate,
        category: todo.category,
        tags: todo.tags,
        color: todo.color,
        subtasks: todo.subtasks,
        attachments: todo.attachments,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
        completedAt: todo.completedAt,
        deletedAt: todo.deletedAt,
        externalCalendarEventId: todo.externalCalendarEventId,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const replaceAll = mutation({
  args: {
    todos: v.array(todoRecord),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('todos')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    await Promise.all(existing.map(todo => ctx.db.delete(todo._id)));
    await Promise.all(args.todos.map(todo => ctx.db.insert('todos', { ...todo, userId })));
    return null;
  },
});

export const deleteAllForCurrentUser = mutation({
  args: {},
  handler: async ctx => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('todos')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect();

    await Promise.all(existing.map(todo => ctx.db.delete(todo._id)));
    return null;
  },
});
