import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { adminMessageQuerySchema } from '../../../../shared/schemas'
import { contactMessages } from '../../../database/schema'

const pageSize = 20

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    const query = adminMessageQuerySchema.parse(getQuery(event))
    const conditions = [isNull(contactMessages.deletedAt)]
    if (query.status !== 'all') conditions.push(eq(contactMessages.status, query.status))
    if (query.q) {
      const escaped = query.q.replace(/[\\%_]/g, '\\$&')
      conditions.push(or(
        ilike(contactMessages.name, `%${escaped}%`),
        ilike(contactMessages.email, `%${escaped}%`),
        ilike(contactMessages.subject, `%${escaped}%`),
      )!)
    }
    const where = and(...conditions)
    const db = useDb()
    const [items, [totalRow], [newRow]] = await Promise.all([
      db.select({
        id: contactMessages.id,
        name: contactMessages.name,
        email: contactMessages.email,
        subject: contactMessages.subject,
        status: contactMessages.status,
        createdAt: contactMessages.createdAt,
      }).from(contactMessages).where(where).orderBy(desc(contactMessages.createdAt)).limit(pageSize).offset((query.page - 1) * pageSize),
      db.select({ value: count() }).from(contactMessages).where(where),
      db.select({ value: count() }).from(contactMessages).where(and(isNull(contactMessages.deletedAt), eq(contactMessages.status, 'new'))),
    ])
    return ok({ items, total: totalRow?.value || 0, newCount: newRow?.value || 0, page: query.page, pageSize })
  }
  catch (error) { validationError(error) }
})
