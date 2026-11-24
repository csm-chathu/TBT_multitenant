'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { OutputData } from '@editorjs/editorjs'
import { ArrowLeft, Check, Loader2, Plus, Search, Trash2 } from 'lucide-react'
import Editor, { type EditorHandle } from './editor'
import {
    getAllNotes,
    createNoteApi,
    updateNoteApi,
    deleteNoteApi,
    type NoteItem,
} from '@/services/noteService'
import useToast from '@/hooks/useToast'

const starterContent: OutputData = { blocks: [{ type: 'paragraph', data: { text: '' } }] }

const formatUpdatedTime = (isoString?: string, defaultLabel = 'Just now'): string => {
    if (!isoString) return defaultLabel
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return defaultLabel

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`
    if (diffInSeconds < 86400) return 'Today'
    if (diffInSeconds < 172800) return 'Yesterday'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const Notes = () => {
    const toast = useToast()
    const [notes, setNotes] = useState<NoteItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeId, setActiveId] = useState<number | null>(null)
    const [query, setQuery] = useState('')
    const [dirty, setDirty] = useState(false)
    const [showClosePrompt, setShowClosePrompt] = useState(false)
    const editorRef = useRef<EditorHandle>(null)

    const activeNote = notes.find((note) => note.id === activeId)
    const filteredNotes = useMemo(
        () => notes.filter((note) => (note.title || 'Untitled').toLowerCase().includes(query.toLowerCase())),
        [notes, query]
    )

    // Fetch all notes from API on component mount
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getAllNotes()
            setNotes(data)
        } catch (err) {
            toast.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNotes()
    }, [fetchNotes])

    const createNote = useCallback(() => {
        // Local draft note (negative ID indicates it is not yet saved to backend)
        const draftNote: NoteItem = {
            id: -Date.now(),
            title: '',
            content: starterContent,
        }
        setNotes((current) => [draftNote, ...current])
        setActiveId(draftNote.id)
        setDirty(true)
    }, [])

    const updateNoteLocal = useCallback((id: number, patch: Partial<NoteItem>) => {
        setNotes((current) => current.map((note) => (note.id === id ? { ...note, ...patch } : note)))
        setDirty(true)
    }, [])

    const saveNote = useCallback(async () => {
        if (activeId === null || !activeNote) return
        try {
            setSaving(true)
            const latestContent = (await editorRef.current?.save()) || activeNote.content || starterContent
            const titleToSend = activeNote.title || 'Untitled'

            if (activeNote.id < 0) {
                // New draft note -> POST to create in backend
                const createdNote = await createNoteApi({
                    title: titleToSend,
                    content: latestContent,
                })
                setNotes((current) => current.map((note) => (note.id === activeId ? createdNote : note)))
                setActiveId(createdNote.id)
                setDirty(false)
                toast.success('Note created and saved')
            } else {
                // Existing note -> PUT to update in backend
                const updatedNote = await updateNoteApi(activeId, {
                    title: titleToSend,
                    content: latestContent,
                })
                setNotes((current) => current.map((note) => (note.id === activeId ? updatedNote : note)))
                setDirty(false)
                toast.success('Note saved successfully')
            }
        } catch (err) {
            toast.error(err)
        } finally {
            setSaving(false)
        }
    }, [activeId, activeNote])

    const requestClose = useCallback(() => {
        if (dirty) setShowClosePrompt(true)
        else {
            // Remove unsaved draft if navigating away
            if (activeNote && activeNote.id < 0) {
                setNotes((current) => current.filter((n) => n.id !== activeNote.id))
            }
            setActiveId(null)
        }
    }, [dirty, activeNote])

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!dirty) return
            event.preventDefault()
            event.returnValue = 'You have unsaved changes.'
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [dirty])

    const deleteNote = useCallback(async (id: number) => {
        try {
            // If local draft (< 0), don't call API delete
            if (id > 0) {
                await deleteNoteApi(id)
            }
            setNotes((current) => current.filter((note) => note.id !== id))
            if (activeId === id) {
                setActiveId(null)
            }
            setDirty(false)
            if (id > 0) {
                toast.success('Note deleted')
            }
        } catch (err) {
            toast.error(err)
        }
    }, [activeId])

    if (activeNote) {
        return (
            <main className="min-h-screen space-y-4">
                <header className="flex items-center justify-between border-b border-borderColor-secondary pb-4">
                    <button onClick={requestClose} className="group flex items-center gap-3 text-sm transition">
                        <ArrowLeft className="size-4" />
                        <span className="hidden sm:inline">All notes</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">
                            {dirty ? 'Unsaved changes' : 'All changes saved'}
                        </span>
                        <button
                            onClick={saveNote}
                            disabled={!dirty || saving}
                            className="flex h-9 items-center gap-2 rounded-lg bg-secondary-500 px-4 text-xs font-medium text-textColor-inverted transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                !dirty && <Check className="size-3.5" />
                            )}
                            Save note
                        </button>
                    </div>
                </header>
                <section className="mx-auto max-w-3xl rounded-xl px-5 pb-4 pt-8 sm:px-10 sm:pt-10">
                    <input
                        value={activeNote.title}
                        onChange={(event) => updateNoteLocal(activeNote.id, { title: event.target.value })}
                        className="mb-10 w-full border-0 bg-transparent text-2xl font-medium tracking-tight outline-none placeholder:text-textColor-muted/50 sm:text-3xl"
                        placeholder="Untitled"
                        aria-label="Note title"
                    />

                    <Editor
                        ref={editorRef}
                        key={activeNote.id}
                        data={activeNote.content || starterContent}
                        onChange={(content) => updateNoteLocal(activeNote.id, { content })}
                    />

                    <div className="mt-10 flex items-center justify-between border-t border-borderColor-secondary pt-5 text-xs text-textColor-muted">
                        <span>Last edited {formatUpdatedTime(activeNote.updatedAt).toLowerCase()}</span>
                        <button onClick={() => deleteNote(activeNote.id)} className="flex items-center gap-2 transition hover:text-red-500">
                            <Trash2 className="size-3.5" />
                            Delete note
                        </button>
                    </div>
                </section>

                {showClosePrompt && (
                    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-5 backdrop-blur-sm">
                        <div role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="w-full max-w-sm rounded-2xl border border-borderColor-secondary bg-surface-primary p-4 shadow-xl">
                            <h2 id="unsaved-title" className="text-xl font-medium tracking-tight">Leave without saving?</h2>
                            <p className="mt-1 text-sm leading-6 text-textColor-muted">
                                Your changes will be lost if you leave this note now.
                            </p>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowClosePrompt(false)
                                        setActiveId(null)
                                        setDirty(false)
                                        fetchNotes()
                                    }}
                                    className="rounded-full border border-border px-4 h-8 text-sm font-medium hover:border-danger-100 hover:text-danger-600 hover:bg-danger-100"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={async () => {
                                        await saveNote()
                                        setShowClosePrompt(false)
                                        setActiveId(null)
                                    }}
                                    className="rounded-full bg-primary-500 px-4 h-8 text-sm font-medium text-white"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap gap-2 p-4 items-center justify-between">
                <p className="text-4xl font-medium">Notes</p>
                <button
                    onClick={createNote}
                    disabled={saving}
                    className="h-10 rounded-xl px-3 flex items-center gap-x-2 text-base font-medium text-textColor-inverted bg-secondary-500 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="size-5 animate-spin" /> : <Plus size={20} />}
                    New note
                </button>
            </div>
            <div className="px-4">
                <div className="pb-3 flex justify-between border-b border-borderColor-secondary">
                    <h3>All note {notes.length}</h3>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="size-4" />
                        <span className="sr-only">Search notes</span>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search notes"
                            className="w-28 bg-transparent outline-none placeholder:text-muted-foreground/60 sm:w-40"
                        />
                    </label>
                </div>
            </div>
            {/* Note-Table */}
            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-textColor-muted">
                    <Loader2 className="size-5 animate-spin" /> Loading notes...
                </div>
            ) : (
                <div>
                    {/* Note-Table-Header */}
                    <div className="grid grid-cols-12 px-4 pb-4 text-sm text-textColor-muted font-medium">
                        <div className="col-span-6">Name</div>
                        <div className="col-span-3">Created by</div>
                        <div className="col-span-2">Last modified</div>
                        <div className="col-span-1"></div>
                    </div>
                    {/* Note-Table-row */}
                    {filteredNotes.map((note) => (
                        <div
                            key={note.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveId(note.id)}
                            onKeyDown={(event) => event.key === 'Enter' && setActiveId(note.id)}
                            className="group px-4 block hover:bg-surface-primary rounded-lg"
                        >
                            <div className="py-4 grid grid-cols-12 border-b border-borderColor-secondary items-center">
                                <div className="col-span-6 flex gap-3 items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 16 16">
                                        <path id="doc_svg__Subtract" fill="#0D6BDE" d="M9.91.89c1.512 0 2.269 0 2.846.295.508.258.921.671 1.18 1.18.294.577.295 1.333.295 2.845v5.58c0 1.512 0 2.268-.295 2.846a2.7 2.7 0 0 1-1.18 1.18c-.577.294-1.334.294-2.846.294H6.08c-1.512 0-2.268 0-2.845-.295a2.7 2.7 0 0 1-1.18-1.18c-.294-.577-.295-1.333-.295-2.845V5.21c0-1.512 0-2.268.295-2.846a2.7 2.7 0 0 1 1.18-1.18C3.812.89 4.568.89 6.08.89zM5.1 10.4a.6.6 0 0 0 0 1.2h3.2a.6.6 0 1 0 0-1.2zm0-2.8a.6.6 0 0 0 0 1.2h5.8a.6.6 0 0 0 0-1.2zm0-2.8a.6.6 0 0 0 0 1.2h5.8a.6.6 0 0 0 0-1.2z"></path>
                                        <path id="doc_svg__Decoration" fill="#0D6BDE" d="M4.5 11a.6.6 0 0 1 .6-.6h3.2a.6.6 0 1 1 0 1.2H5.1a.6.6 0 0 1-.6-.6" opacity="0.25"></path>
                                    </svg>
                                    {note.title || 'Untitled'}
                                </div>
                                <div className="col-span-3 text-sm">{note.user?.name || 'You'}</div>
                                <div className="col-span-2 text-xs text-textColor-muted">{formatUpdatedTime(note.updatedAt)}</div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            deleteNote(note.id)
                                        }}
                                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-red-500/20 hover:text-red-500 group-hover:opacity-100"
                                        aria-label={`Delete ${note.title || 'Untitled'}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="py-16 text-center text-sm text-textColor-muted">
                            No notes found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default Notes