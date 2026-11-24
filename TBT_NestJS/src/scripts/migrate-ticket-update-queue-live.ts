import sequelize from "../config/database";
import { DataTypes } from "sequelize";
import * as fs from 'fs';
import * as path from 'path';

/**
 * Complete, unified source code for React TicketQueue component:
 * - Hides internal comments from Recent Activities / Realtime Queue.
 * - Displays author name ('by <authorName>') alongside Ticket #.
 * - Smooth 5-second color fading on live incoming items.
 * - Persistent unread status backed by DB and cleared only on user click.
 */
const TICKET_QUEUE_REACT_SOURCE = `import React, { useState, useEffect, useCallback } from 'react'
import api from '@/services/api'
import usePusherClient from '@/hooks/usePusherClient'

export type TicketQueueItem = {
  id: number | string
  queueId?: number
  ticketId?: number
  eventType?: string
  category: string
  time: string
  title?: string
  authorName?: string
  description: string
  status?: boolean
  priority?: string
  createdAt?: string
  isNew?: boolean
  isFading?: boolean
}

function formatTimeAgo(dateInput?: string | Date): string {
  if (!dateInput) return 'Now'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Now'

  const now = new Date()
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  if (diffInSeconds < 30) return 'Now'
  if (diffInSeconds < 60) return '1 min ago'
  
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return \`\${minutes} min ago\`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return \`\${hours} \${hours === 1 ? 'hour' : 'hours'} ago\`

  const days = Math.floor(hours / 24)
  if (days < 7) return \`\${days} \${days === 1 ? 'day' : 'days'} ago\`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function safeString(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    try {
      const parts: string[] = []
      if (val.status) parts.push(\`Status: \${val.status}\`)
      if (val.priority) parts.push(\`Priority: \${val.priority}\`)
      if (val.title && typeof val.title === 'string') parts.push(val.title)
      if (parts.length > 0) return parts.join(', ')
      return JSON.stringify(val)
    } catch {
      return ''
    }
  }
  return String(val)
}

function mapRawToQueueItem(raw: any, isLiveEvent = false): TicketQueueItem {
  const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : {}
  const eventType = raw.event_type || raw.eventType || payload.eventType || payload.event_type || ''
  const queueId = raw.queueId || raw.id || payload.queueId
  const ticketId = raw.ticket_id || raw.ticketId || payload.ticketId || (eventType !== 'TICKET_CREATED' ? payload.id : undefined)

  let category = typeof payload.category === 'string' ? payload.category : ''
  
  if (category === 'Customer Insights') category = 'Internal Comment'
  if (category === 'Response to client feedback') category = 'Public Comment'

  if (!category) {
    switch (eventType) {
      case 'TICKET_CREATED':
        category = 'Ticket Created'
        break
      case 'STATUS_CHANGED':
        category = 'Status Updated'
        break
      case 'PRIORITY_CHANGED':
        category = 'Priority Changed'
        break
      case 'COMMENT_ADDED':
        category = payload.isInternal || payload.type === 'internal' ? 'Internal Comment' : 'Public Comment'
        break
      case 'FILE_UPLOADED':
        category = 'Upload Attachment'
        break
      case 'DUE_DATE_CHANGED':
        category = 'Due Date Changed'
        break
      default:
        category = 'Recent Activity'
    }
  }

  let title = ticketId ? \`Ticket #\${ticketId}\` : undefined
  if (!title && typeof payload.title === 'string' && !payload.title.includes('added a comment')) {
    title = payload.title
  }

  let description = ''
  let extractedAuthor = ''

  if (typeof payload.description === 'string' && payload.description) {
    description = payload.description
    const commentMatch = description.match(/^([A-Za-z0-9_ -]+)\\s+added a comment:\\s*(.*)$/i)
    if (commentMatch) {
      extractedAuthor = commentMatch[1].trim()
      description = commentMatch[2].trim()
    }
  } else if (payload.changes) {
    description = safeString(payload.changes)
  }

  if (!description) {
    if (payload.title && typeof payload.title === 'string') {
      description = payload.title
    } else if (raw.Ticket?.title) {
      description = raw.Ticket.title
    } else {
      description = eventType ? \`Event: \${eventType}\` : 'Activity update'
    }
  }

  const authorName =
    payload.authorName ||
    payload.author_name ||
    payload.fromUserStr ||
    payload.from_name ||
    payload.user_name ||
    raw.creator?.name ||
    raw.creator?.username ||
    raw.creator?.email ||
    extractedAuthor ||
    ''

  // Check if item status in DB is unread (false, 0, '0', 'false', 'pending')
  const isUnreadInDb =
    raw.status === false ||
    raw.status === 0 ||
    raw.status === '0' ||
    raw.status === 'false' ||
    raw.status === 'pending'

  const isNewItem = isLiveEvent || isUnreadInDb

  return {
    id: queueId ? String(queueId) : String(Math.random()),
    queueId: queueId ? Number(queueId) : undefined,
    ticketId: ticketId ? Number(ticketId) : undefined,
    eventType: eventType ? String(eventType) : undefined,
    category: safeString(category) || 'Recent Activity',
    time: formatTimeAgo(raw.createdAt || raw.created_at),
    title: title ? safeString(title) : undefined,
    authorName: safeString(authorName) || undefined,
    description: safeString(description) || 'Ticket activity update',
    status: Boolean(raw.status),
    priority: safeString(raw.priority),
    createdAt: raw.createdAt || raw.created_at,
    isNew: isNewItem,
    isFading: isLiveEvent,
  }
}

interface TicketQueueProps {
  onSelectTicket?: (ticketId: number) => void
}

const TicketQueue: React.FC<TicketQueueProps> = ({ onSelectTicket }) => {
  const [items, setItems] = useState<TicketQueueItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const { subscribe } = usePusherClient({ autoConnect: true })

  // Helper to check if an item is an allowed follow up item (Ticket Created or Public Comment only)
  const isAllowedFollowUpItem = (item: TicketQueueItem) => {
    const cat = (item.category || '').toLowerCase().trim()
    const evt = (item.eventType || '').toUpperCase().trim()

    // Explicitly exclude internal comments
    if (cat === 'internal comment' || cat === 'customer insights') {
      return false
    }

    const isTicketCreated =
      cat === 'ticket created' ||
      evt === 'TICKET_CREATED'

    const isPublicComment =
      cat === 'public comment' ||
      cat === 'response to client feedback' ||
      (evt === 'COMMENT_ADDED' && cat !== 'internal comment')

    return isTicketCreated || isPublicComment
  }

  // Filter out any update info that is NOT ticket created or public comment
  const isIgnoredItem = (item: TicketQueueItem) => !isAllowedFollowUpItem(item)

  // Live incoming WebSocket events trigger smooth 5-second color fade
  const addNewLiveItem = useCallback((rawPayload: any) => {
    const newItem = mapRawToQueueItem(rawPayload, true)
    // Only show ticket created and public comments in follow up texts
    if (isIgnoredItem(newItem)) return

    newItem.isNew = true
    newItem.isFading = true

    setItems((prev) => {
      const filtered = prev.filter(
        (i) =>
          String(i.id) !== String(newItem.id) &&
          String(i.queueId) !== String(newItem.queueId) &&
          !isIgnoredItem(i)
      )
      return [newItem, ...filtered]
    })

    // Trigger smooth 5-second color transition down to steady highlight
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          String(item.id) === String(newItem.id) ? { ...item, isFading: false } : item
        )
      )
    }, 50)
  }, [])

  const fetchQueue = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    try {
      // Pass status=all and onlyFollowUp=true to fetch only ticket created and comment updates
      const res = await api.get('/realtime/queue', {
        params: { status: 'all', limit: 20, onlyFollowUp: 'true' },
      })
      const rawList = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
      if (Array.isArray(rawList) && rawList.length > 0) {
        setItems((prevItems) => {
          const activeLiveItemsMap = new Map<string, TicketQueueItem>()
          prevItems.forEach((i) => {
            if (i.isNew && !isIgnoredItem(i)) {
              if (i.queueId) activeLiveItemsMap.set(\`q_\${i.queueId}\`, i)
              if (i.id) activeLiveItemsMap.set(String(i.id), i)
            }
          })

          const fetchedMapped = rawList
            .map((raw: any) => {
              const mapped = mapRawToQueueItem(raw, false)
              const liveMatch =
                (mapped.queueId && activeLiveItemsMap.get(\`q_\${mapped.queueId}\`)) ||
                activeLiveItemsMap.get(String(mapped.id))

              if (liveMatch) {
                return {
                  ...mapped,
                  isNew: true, // Preserve NEW tag if unread in DB or received live
                  isFading: false,
                }
              }
              return mapped
            })
            // Only allow Ticket Created and Public Comment in follow up texts
            .filter((item) => !isIgnoredItem(item))

          // Preserve unmerged live items that haven't been returned by REST API yet
          const fetchedIdSet = new Set(fetchedMapped.map((m) => String(m.id)))
          const unmergedLiveItems = prevItems.filter(
            (i) => i.isNew && !fetchedIdSet.has(String(i.id)) && !isIgnoredItem(i)
          )

          return [...unmergedLiveItems, ...fetchedMapped]
        })
      } else {
        setItems((prevItems) => {
          const liveItems = prevItems.filter((i) => i.isNew && !isIgnoredItem(i))
          return liveItems
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[TicketQueue] Failed to load queue from backend', err)
    } finally {
      setLoading(false)
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 300)
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Polling fallback every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  // Subscribe to live Pusher event 'ticket.queue.new_event'
  useEffect(() => {
    let unsub: (() => void) | null = null

    const setupPusher = async () => {
      try {
        unsub = await subscribe('private-dashboard', 'ticket.queue.new_event', (payload: any) => {
          if (payload) addNewLiveItem(payload)
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[TicketQueue] Realtime queue pusher subscription failed', err)
      }
    }

    setupPusher()

    return () => {
      if (unsub) unsub()
    }
  }, [subscribe, addNewLiveItem])

  // Listen to window event 'ticket.queue.new_event'
  useEffect(() => {
    const handleRealtimeEvent = (e: Event) => {
      const customEvent = e as CustomEvent
      const { event, payload } = customEvent.detail || {}

      if (event === 'ticket.queue.new_event' && payload) {
        addNewLiveItem(payload)
      } else if (['ticket.created', 'ticket.updated', 'ticket.comment.public'].includes(event)) {
        fetchQueue()
      }
    }

    window.addEventListener('realtime:event', handleRealtimeEvent)
    return () => {
      window.removeEventListener('realtime:event', handleRealtimeEvent)
    }
  }, [fetchQueue, addNewLiveItem])

  const handleItemClick = async (item: TicketQueueItem) => {
    // Dismiss yellow NEW tag locally & persist ACK in database
    if (item.isNew || item.isFading) {
      setItems((prev) =>
        prev.map((i) =>
          String(i.id) === String(item.id) ? { ...i, isNew: false, isFading: false, status: true } : i
        )
      )

      // Persist acknowledged status to backend DB so it stays read on refresh/page navigation
      const targetId = item.queueId || (typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10))
      if (targetId && !isNaN(targetId)) {
        try {
          await api.post(\`/realtime/queue/\${targetId}/ack\`, { status: true })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(\`[TicketQueue] Failed to acknowledge queue item #\${targetId}\`, err)
        }
      }
    }

    if (item.ticketId && onSelectTicket) {
      onSelectTicket(item.ticketId)
    }
  }

  const newItemsCount = items.filter((i) => i.isNew && !isIgnoredItem(i)).length

  if (loading) {
    return (
      <div className="overflow-auto h-[360px] p-4 space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="animate-pulse space-y-2 py-2 border-b border-borderColor-secondary">
            <div className="h-4 bg-surface-tertiary rounded w-2/3" />
            <div className="h-3 bg-surface-tertiary rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[360px]">
      <div className="flex justify-between items-center px-4 py-1.5 text-xs text-textColor-muted border-b border-borderColor-secondary bg-surface-secondary/40">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Realtime Queue
          {newItemsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {newItemsCount} NEW
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => fetchQueue(true)}
          className="hover:text-primary-500 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          title="Refresh Queue"
        >
          <span className={\`material-symbols-outlined text-sm \${isRefreshing ? 'animate-spin' : ''}\`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      <div className="overflow-auto flex-1 divide-y divide-borderColor-secondary">
        {items.filter((item) => !isIgnoredItem(item)).length === 0 ? (
          <div className="p-6 text-center text-sm text-textColor-muted">
            No recent ticket queue activity
          </div>
        ) : (
          items
            .filter((item) => !isIgnoredItem(item))
            .map((item) => (
            <div
              key={\`\${item.id}-\${item.category}-\${item.time}\`}
              onClick={() => handleItemClick(item)}
              className={\`space-y-1 py-2 px-4 \${
                item.ticketId ? 'cursor-pointer' : ''
              } \${
                item.isNew
                  ? item.isFading
                    ? 'bg-amber-500/35 border-l-4 border-l-amber-500 transition-colors duration-[5000ms] ease-out'
                    : 'bg-amber-500/10 border-l-4 border-l-amber-500 transition-colors duration-[5000ms] ease-out'
                  : 'hover:bg-surface-secondary transition-colors duration-200'
              }\`}
            >
              <div className="flex justify-between gap-4 text-sm text-textColor-muted font-medium">
                <div className="max-w-8/12 flex items-center gap-2">
                  <h4>{item.category}</h4>
                  {item.isNew && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      NEW
                    </span>
                  )}
                </div>
                <span className="max-w-4/12 text-right text-xs opacity-80">{item.time}</span>
              </div>
              {item.title && (
                <h5 className="font-medium text-sm text-textColor-primary flex items-center gap-1.5">
                  <span>{item.title}</span>
                  {item.authorName && (
                    <span className="text-xs text-textColor-muted font-normal">
                      by {item.authorName}
                    </span>
                  )}
                </h5>
              )}
              <p className="text-sm text-textColor-secondary">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TicketQueue
`;

async function updateReactTicketQueueComponent() {
  const targetPath = 'C:\\Users\\kalin\\OneDrive\\Desktop\\MediTech-Data\\TBT_ReactJS\\src\\pages\\Dashboard\\Overview\\TicketQueue.tsx';
  if (fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, TICKET_QUEUE_REACT_SOURCE, 'utf8');
    console.log('✅ React TicketQueue.tsx component updated successfully with author support and internal comments filtered.');
  }

  // Update Overview.tsx: Rename 'Recent Activity' to 'Follow up texts'
  const overviewPath = 'C:\\Users\\kalin\\OneDrive\\Desktop\\MediTech-Data\\TBT_ReactJS\\src\\pages\\Dashboard\\Overview.tsx';
  if (fs.existsSync(overviewPath)) {
    let overviewContent = fs.readFileSync(overviewPath, 'utf8');
    if (overviewContent.includes("'Recent Activity'")) {
      overviewContent = overviewContent.replace(
        "{chartType === 'pie' ? 'Total Tickets' : 'Recent Activity'}",
        "{chartType === 'pie' ? 'Total Tickets' : 'Follow up texts'}"
      );
      overviewContent = overviewContent.replace(
        "/* Total Tickets Chart / Recent Activity Switch */",
        "/* Total Tickets Chart / Follow up texts Switch */"
      );
      fs.writeFileSync(overviewPath, overviewContent, 'utf8');
      console.log("✅ React Overview.tsx updated: 'Recent Activity' renamed to 'Follow up texts'.");
    }
  }
}

async function migrateTicketUpdateQueueLive() {
  console.log('--- Starting Unified Live Database & Frontend Migration for ticket_update_queue ---');
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to Live Database successfully.');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Check if table exists, create if missing
    let tableExists = false;
    try {
      const tables = await queryInterface.showAllTables();
      tableExists = tables.map(t => String(t).toLowerCase()).includes('ticket_update_queue');
    } catch {
      tableExists = false;
    }

    if (!tableExists) {
      console.log('Creating ticket_update_queue table...');
      await queryInterface.createTable('ticket_update_queue', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ticket_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'tickets',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        event_type: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        status: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        priority: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'medium',
        },
        payload: {
          type: DataTypes.TEXT('long'),
          allowNull: true,
        },
        error_message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        processed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_by: {
          type: DataTypes.BIGINT,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      });
      console.log('✅ Table ticket_update_queue created successfully.');
    } else {
      console.log('ℹ️ Table ticket_update_queue already exists. Performing safe live column migration...');
    }

    // 2. Migrate legacy status string data ('pending', 'completed') to boolean (0/1)
    try {
      console.log('Migrating legacy status string values...');
      await sequelize.query("UPDATE `ticket_update_queue` SET `status` = '0' WHERE `status` = 'pending' OR `status` IS NULL;");
      await sequelize.query("UPDATE `ticket_update_queue` SET `status` = '1' WHERE `status` = 'completed';");
      console.log('✅ Legacy status values updated.');
    } catch (e: any) {
      console.warn('Status update notice:', e?.message || e);
    }

    // 3. Alter status column data type to TINYINT(1) / BOOLEAN
    try {
      console.log('Altering status column to TINYINT(1) NOT NULL DEFAULT 0...');
      await sequelize.query('ALTER TABLE `ticket_update_queue` MODIFY COLUMN `status` TINYINT(1) NOT NULL DEFAULT 0;');
      console.log('✅ Status column type modified to TINYINT(1) / BOOLEAN.');
    } catch (e: any) {
      console.warn('Column modify notice:', e?.message || e);
    }

    // 4. Create performance indexes
    try {
      console.log('Adding performance indexes...');
      await queryInterface.addIndex('ticket_update_queue', ['status', 'createdAt'], {
        name: 'idx_ticket_update_queue_status_created',
      });
      console.log('✅ Index idx_ticket_update_queue_status_created added.');
    } catch (e: any) {
      console.log('Notice (index may already exist):', e?.message || e);
    }

    try {
      await queryInterface.addIndex('ticket_update_queue', ['ticket_id'], {
        name: 'idx_ticket_update_queue_ticket_id',
      });
      console.log('✅ Index idx_ticket_update_queue_ticket_id added.');
    } catch (e: any) {
      console.log('Notice (index may already exist):', e?.message || e);
    }

    // 5. Update React frontend TicketQueue component
    await updateReactTicketQueueComponent();

    console.log('--- ✅ Combined Live Database & Ticket Queue Migration Completed Successfully! ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTicketUpdateQueueLive();
