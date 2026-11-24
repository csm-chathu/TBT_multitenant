"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2, Plus, Check, X } from "lucide-react"
import {
  getCannedReplies,
  createCannedReply,
  updateCannedReply,
  deleteCannedReply,
  type CannedReply,
} from "@/services/cannedReplyService"
import useToast from "@/hooks/useToast"

interface MetaSection {
  id: string
  title: string
}

const META_SECTIONS: MetaSection[] = [
  { id: "canned-replies", title: "Canned Replies" },
  // Add future meta sections here
]

const MetaPage = () => {
  const [activeSection, setActiveSection] = useState(META_SECTIONS[0].id)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Meta</h1>
        <p className="text-sm text-textColor-muted mt-1">Manage metadata used across the system.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Section nav */}
        <ul className="col-span-3 space-y-1">
          {META_SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-primary-100 text-textColor-base"
                    : "text-textColor-muted hover:text-textColor-base hover:bg-surface-secondary"
                }`}
              >
                {section.title}
              </button>
            </li>
          ))}
        </ul>

        {/* Section content */}
        <div className="col-span-9">
          {activeSection === "canned-replies" && <CannedRepliesSection />}
        </div>
      </div>
    </div>
  )
}

const CannedRepliesSection = () => {
  const { success: toastSuccess, error: toastError } = useToast()
  const [replies, setReplies] = useState<CannedReply[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState("")
  const [adding, setAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    getCannedReplies()
      .then(setReplies)
      .catch(() => toastError("Failed to load canned replies"))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const created = await createCannedReply(trimmed)
      setReplies((prev) => [...prev, created])
      setNewText("")
      setShowAddForm(false)
      toastSuccess("Canned reply added")
    } catch {
      toastError("Failed to add canned reply")
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (reply: CannedReply) => {
    setEditingId(reply.id)
    setEditText(reply.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText("")
  }

  const handleUpdate = async (id: number) => {
    const trimmed = editText.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const updated = await updateCannedReply(id, trimmed)
      if (updated) {
        setReplies((prev) => prev.map((r) => (r.id === id ? { ...r, text: trimmed } : r)))
      }
      setEditingId(null)
      toastSuccess("Canned reply updated")
    } catch {
      toastError("Failed to update canned reply")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteCannedReply(id)
      setReplies((prev) => prev.filter((r) => r.id !== id))
      toastSuccess("Canned reply deleted")
    } catch {
      toastError("Failed to delete canned reply")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Canned Replies</h3>
          <p className="text-xs text-textColor-muted mt-0.5">
            Predefined messages agents can insert into ticket comments.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary-500 hover:bg-primary-600 text-base-white"
          >
            <Plus size={15} />
            Add Reply
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="p-4 rounded-lg border border-borderColor-secondary bg-surface-primary space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type the canned reply text..."
            rows={3}
            className="w-full p-3 text-sm border border-borderColor-secondary rounded-md bg-transparent text-textColor-base resize-vertical focus:outline-none focus:border-primary-400"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setNewText("") }}
              className="px-3 py-1.5 text-sm rounded-md border border-borderColor-secondary hover:bg-surface-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="px-3 py-1.5 text-sm rounded-md bg-primary-500 hover:bg-primary-600 text-base-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-md bg-surface-secondary animate-pulse" />
          ))}
        </div>
      ) : replies.length === 0 ? (
        <p className="text-sm text-textColor-muted py-6 text-center border border-dashed border-borderColor-secondary rounded-lg">
          No canned replies yet. Add one above.
        </p>
      ) : (
        <ul className="divide-y divide-borderColor-secondary border border-borderColor-secondary rounded-lg overflow-hidden">
          {replies.map((reply) => (
            <li key={reply.id} className="px-4 py-3 bg-surface-primary">
              {editingId === reply.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full p-2 text-sm border border-borderColor-secondary rounded-md bg-transparent text-textColor-base resize-vertical focus:outline-none focus:border-primary-400"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 rounded-md text-textColor-muted hover:text-textColor-base hover:bg-surface-secondary"
                      title="Cancel"
                    >
                      <X size={15} />
                    </button>
                    <button
                      onClick={() => handleUpdate(reply.id)}
                      disabled={!editText.trim() || saving}
                      className="p-1.5 rounded-md text-green-600 hover:bg-green-50 disabled:opacity-50"
                      title="Save"
                    >
                      <Check size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-textColor-base whitespace-pre-wrap break-words flex-1">
                    {reply.text}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(reply)}
                      className="p-1.5 rounded-md text-textColor-muted hover:text-textColor-base hover:bg-surface-secondary"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(reply.id)}
                      disabled={deletingId === reply.id}
                      className="p-1.5 rounded-md text-textColor-muted hover:text-red-500 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MetaPage
