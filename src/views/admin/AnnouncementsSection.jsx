'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api.js'
import {
    Badge,
    DangerButton,
    EmptyState,
    ErrorBanner,
    Field,
    Modal,
    NoticeBanner,
    Panel,
    PrimaryButton,
    RowButton,
    SecondaryButton,
    Spinner,
    cx,
    formatDateTime,
    inputClass,
    textareaClass,
} from './ui.jsx'

const EMPTY_FORM = { title: '', body: '', is_published: false }

function AnnouncementsSection({ onDataChanged }) {
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [busyId, setBusyId] = useState(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [modalError, setModalError] = useState('')

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const data = await apiRequest('/api/admin/announcements')
            setAnnouncements(data.announcements || [])
            setError('')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    function openNew() {
        setEditing(null)
        setForm(EMPTY_FORM)
        setModalError('')
        setModalOpen(true)
    }

    function openEdit(announcement) {
        setEditing(announcement)
        setForm({
            title: announcement.title || '',
            body: announcement.body || '',
            is_published: Boolean(announcement.is_published),
        })
        setModalError('')
        setModalOpen(true)
    }

    async function save(event) {
        event.preventDefault()
        if (saving) return
        setSaving(true)
        setModalError('')

        try {
            if (editing) {
                await apiRequest(`/api/admin/announcements/${editing.id}`, { method: 'PUT', body: form })
                setNotice('Announcement updated.')
            } else {
                await apiRequest('/api/admin/announcements', { method: 'POST', body: form })
                setNotice(form.is_published ? 'Announcement published.' : 'Announcement saved as a draft.')
            }
            setModalOpen(false)
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setModalError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function togglePublication(announcement) {
        setBusyId(announcement.id)
        try {
            await apiRequest(`/api/admin/announcements/${announcement.id}/publication`, {
                method: 'PATCH',
                body: { is_published: !announcement.is_published },
            })
            setNotice(announcement.is_published ? 'Announcement unpublished.' : 'Announcement published to the student dashboard.')
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusyId(null)
        }
    }

    async function remove(announcement) {
        if (!window.confirm(`Delete “${announcement.title}”?`)) return
        setBusyId(announcement.id)
        try {
            await apiRequest(`/api/admin/announcements/${announcement.id}`, { method: 'DELETE' })
            setNotice('Announcement deleted.')
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setBusyId(null)
        }
    }

    const published = announcements.filter((item) => item.is_published).length

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}
            <NoticeBanner message={notice} onDismiss={() => setNotice('')} />

            <Panel
                title="Announcements"
                description={`${published} published · ${announcements.length - published} draft${announcements.length - published === 1 ? '' : 's'}. Published notices appear on the student dashboard.`}
                actions={<PrimaryButton onClick={openNew}>+ New announcement</PrimaryButton>}
            >
                {loading ? (
                    <Spinner label="Loading announcements…" />
                ) : announcements.length === 0 ? (
                    <EmptyState
                        title="No announcements yet"
                        description="Publish platform updates, event reminders, or maintenance notices for students."
                    />
                ) : (
                    <div className="divide-y divide-white/[0.05]">
                        {announcements.map((announcement) => (
                            <article key={announcement.id} className="px-4 py-4 sm:px-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-[13px] font-semibold text-white/90">{announcement.title}</h3>
                                            <Badge tone={announcement.is_published ? 'neon' : 'muted'}>
                                                {announcement.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                            {announcement.author || 'unknown'} · created {formatDateTime(announcement.created_at)}
                                            {announcement.published_at ? ` · published ${formatDateTime(announcement.published_at)}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-1.5">
                                        <RowButton onClick={() => openEdit(announcement)}>
                                            Edit
                                        </RowButton>
                                        <button
                                            type="button"
                                            onClick={() => togglePublication(announcement)}
                                            disabled={busyId === announcement.id}
                                            className={cx(
                                                'rounded-md border px-2 py-1 text-[9.5px] transition disabled:opacity-40',
                                                announcement.is_published
                                                    ? 'border-amber-400/20 text-amber-300/80 hover:border-amber-400/40'
                                                    : 'border-neon/20 text-neon/80 hover:border-neon/40'
                                            )}
                                        >
                                            {announcement.is_published ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <DangerButton
                                            onClick={() => remove(announcement)}
                                            disabled={busyId === announcement.id}
                                            className="h-auto rounded-md px-2 py-1 text-[9.5px]"
                                        >
                                            Delete
                                        </DangerButton>
                                    </div>
                                </div>
                                <p className="mt-2.5 max-w-4xl whitespace-pre-line text-[11.5px] leading-relaxed text-white/65">
                                    {announcement.body}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </Panel>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editing ? 'Edit announcement' : 'New announcement'}
                description={editing ? `Announcement #${editing.id}` : 'Write a notice for the student dashboard.'}
                width="max-w-2xl"
            >
                <form onSubmit={save} className="space-y-3.5">
                    {modalError ? <ErrorBanner message={modalError} /> : null}

                    <Field label="Title">
                        <input
                            value={form.title}
                            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                            maxLength={160}
                            required
                            className={inputClass}
                            placeholder="Weekend CTF sprint"
                        />
                    </Field>

                    <Field label="Description">
                        <textarea
                            value={form.body}
                            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                            rows={7}
                            required
                            className={textareaClass}
                            placeholder="Explain the announcement clearly for students."
                        />
                    </Field>

                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5">
                        <input
                            type="checkbox"
                            checked={form.is_published}
                            onChange={(event) => setForm((current) => ({ ...current, is_published: event.target.checked }))}
                            className="size-3.5 accent-[#73f76d]"
                        />
                        <span>
                            <span className="block text-[11.5px] font-medium text-white/80">Publish immediately</span>
                            <span className="block text-[10px] text-muted">Visible on the student dashboard when checked.</span>
                        </span>
                    </label>

                    <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
                        <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
                        <PrimaryButton type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create announcement'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default AnnouncementsSection
