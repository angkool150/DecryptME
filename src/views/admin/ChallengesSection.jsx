'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, getToken, readJson } from '../../lib/api.js'
import {
    Badge,
    EmptyState,
    ErrorBanner,
    Field,
    Modal,
    NoticeBanner,
    Panel,
    PrimaryButton,
    RowButton,
    SecondaryButton,
    Select,
    Spinner,
    cx,
    formatDateTime,
    inputClass,
    textareaClass,
} from './ui.jsx'

const EMPTY_FORM = {
    title: '',
    slug: '',
    category_id: '',
    difficulty: 'easy',
    points: 50,
    description: '',
    flag: '',
    attachment_url: '',
    is_active: true,
}

const EMPTY_STEP = {
    text: '',
    title: '',
    body: '',
    link: '',
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

function categoryAllowsAttachment(category) {
    const slug = String(category?.slug ?? category?.category_slug ?? '').trim().toLowerCase()
    const name = String(category?.name ?? category?.category_name ?? '').trim().toLowerCase()
    return slug === 'forensics' || name === 'forensics'
}

function attachmentName(url) {
    const name = String(url || '').split('/').pop() || 'attachment'
    try {
        return decodeURIComponent(name)
    } catch {
        return name
    }
}

// Uploads are stored as Supabase object keys ("Challenges/file.png").
function isUploadedAttachment(url) {
    const value = String(url || '').trim()
    return Boolean(value) && !value.startsWith('/') && !/^https?:\/\//i.test(value)
}

function flagPreview(value) {
    const trimmed = String(value || '').trim()
    if (!trimmed) return ''
    const wrapped = trimmed.match(/^flag\{([\s\S]*)\}$/i)
    const inner = (wrapped ? wrapped[1] : trimmed).trim()
    return inner ? `flag{${inner}}` : ''
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100)
}

function ChallengesSection({ onDataChanged }) {
    const [challenges, setChallenges] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')

    const [modalOpen, setModalOpen] = useState(false)
    const [tab, setTab] = useState('details')
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [slugTouched, setSlugTouched] = useState(false)
    const [saving, setSaving] = useState(false)
    const [modalError, setModalError] = useState('')
    const [attachmentBusy, setAttachmentBusy] = useState(false)
    const [attachmentError, setAttachmentError] = useState('')
    const [draggingAttachment, setDraggingAttachment] = useState(false)
    const attachmentInputRef = useRef(null)

    const [stepForm, setStepForm] = useState(EMPTY_STEP)
    const [editingStepId, setEditingStepId] = useState(null)
    const [stepBusy, setStepBusy] = useState(false)
    const [stepError, setStepError] = useState('')

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            const data = await apiRequest('/api/admin/challenges')
            setChallenges(data.challenges || [])
            setCategories(data.categories || [])
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

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase()
        return challenges.filter((challenge) => {
            const matchesSearch = !needle
                || challenge.title.toLowerCase().includes(needle)
                || challenge.slug.toLowerCase().includes(needle)
            const matchesCategory = categoryFilter === 'all' || String(challenge.category_id) === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [challenges, search, categoryFilter])

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(form.category_id)
    )
    const allowsAttachment = categoryAllowsAttachment(selectedCategory)

    async function loadDetail(id) {
        const data = await apiRequest(`/api/admin/challenges/${id}`)
        return data.challenge
    }

    async function downloadAttachment() {
        const key = String(form.attachment_url || '').trim()
        if (!key) return
        setAttachmentError('')
        try {
            const token = getToken()
            const response = await fetch(`/api/admin/uploads/download?url=${encodeURIComponent(key)}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await readJson(response, { fallback: {} })
            if (!response.ok || !data.url) throw new Error(data.error || 'Could not download attachment.')
            window.location.assign(data.url)
        } catch (err) {
            setAttachmentError(err.message || 'Could not download attachment.')
        }
    }

    async function uploadAttachment(file) {
        if (!file) return
        if (!allowsAttachment) {
            setAttachmentError('Attachments are only available for Forensics challenges.')
            return
        }
        if (!file.size) {
            setAttachmentError('That file is empty.')
            return
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
            setAttachmentError('Attachment must be 25 MB or smaller.')
            return
        }

        setAttachmentBusy(true)
        setAttachmentError('')
        try {
            const token = getToken()
            const response = await fetch(
                `/api/admin/uploads?name=${encodeURIComponent(file.name)}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/octet-stream',
                    },
                    body: file,
                }
            )
            const text = await response.text()
            let data = null
            if (text) {
                try {
                    data = JSON.parse(text)
                } catch {
                    data = { error: text }
                }
            }
            if (!response.ok) {
                throw new Error(data?.error || `Upload failed (${response.status}).`)
            }
            setForm((current) => ({ ...current, attachment_url: data.url }))
        } catch (err) {
            setAttachmentError(err.message || 'Attachment upload failed.')
        } finally {
            setAttachmentBusy(false)
        }
    }

    function handleAttachmentInput(event) {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (file) uploadAttachment(file)
    }

    function handleAttachmentDrop(event) {
        event.preventDefault()
        setDraggingAttachment(false)
        const file = event.dataTransfer.files?.[0]
        if (file) uploadAttachment(file)
    }

    function openNew() {
        setSelected(null)
        setForm({
            ...EMPTY_FORM,
            category_id: categories[0]?.id ? String(categories[0].id) : '',
        })
        setSlugTouched(false)
        setTab('details')
        setModalError('')
        setStepError('')
        setStepForm(EMPTY_STEP)
        setEditingStepId(null)
        setAttachmentBusy(false)
        setAttachmentError('')
        setDraggingAttachment(false)
        setModalOpen(true)
    }

    async function openChallenge(challenge, nextTab = 'details') {
        setModalError('')
        setStepError('')
        setStepForm(EMPTY_STEP)
        setEditingStepId(null)
        setAttachmentBusy(false)
        setAttachmentError('')
        setDraggingAttachment(false)
        try {
            const detail = await loadDetail(challenge.id)
            setSelected(detail)
            setForm({
                title: detail.title || '',
                slug: detail.slug || '',
                category_id: String(detail.category_id || ''),
                difficulty: detail.difficulty || 'easy',
                points: detail.points || 50,
                description: detail.description || '',
                flag: '',
                attachment_url: categoryAllowsAttachment(detail) ? detail.attachment_url || '' : '',
                is_active: Boolean(detail.is_active),
            })
            setSlugTouched(true)
            setTab(nextTab)
            setModalOpen(true)
        } catch (err) {
            setError(err.message)
        }
    }

    async function saveChallenge(event) {
        event.preventDefault()
        if (saving || attachmentBusy) return
        setSaving(true)
        setModalError('')

        const payload = {
            ...form,
            category_id: Number(form.category_id),
            points: Number(form.points),
        }

        try {
            const data = selected
                ? await apiRequest(`/api/admin/challenges/${selected.id}`, { method: 'PUT', body: payload })
                : await apiRequest('/api/admin/challenges', { method: 'POST', body: payload })

            const detail = data.challenge
            setSelected(detail)
            setForm((current) => ({
                ...current,
                title: detail.title,
                slug: detail.slug,
                category_id: String(detail.category_id),
                difficulty: detail.difficulty,
                points: detail.points,
                description: detail.description,
                flag: '',
                attachment_url: detail.attachment_url || '',
                is_active: Boolean(detail.is_active),
            }))
            setSlugTouched(true)
            setTab('modules')
            setNotice(selected ? 'Challenge updated.' : 'Challenge created. Add the solve steps below.')
            setModalError('')
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setModalError(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function togglePublication(challenge) {
        try {
            await apiRequest(`/api/admin/challenges/${challenge.id}/publication`, {
                method: 'PATCH',
                body: { is_active: !challenge.is_active },
            })
            await refresh()
            if (selected?.id === challenge.id) {
                setSelected((current) => current ? { ...current, is_active: !challenge.is_active } : current)
            }
            setNotice(challenge.is_active ? 'Challenge unpublished.' : 'Challenge published.')
            onDataChanged?.()
        } catch (err) {
            setError(err.message)
        }
    }

    async function deleteChallenge(challenge) {
        if (!window.confirm(`Delete “${challenge.title}”? This will permanently remove the challenge, its files, steps, and submission history.`)) return
        try {
            await apiRequest(`/api/admin/challenges/${challenge.id}`, { method: 'DELETE' })
            setNotice('Challenge deleted.')
            if (selected?.id === challenge.id) setModalOpen(false)
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setError(err.message)
        }
    }

    async function reloadSelected() {
        if (!selected) return
        const detail = await loadDetail(selected.id)
        setSelected(detail)
    }

    function startEditStep(step) {
        setEditingStepId(step.id)
        setStepForm({
            text: step.text || '',
            title: step.info?.title || '',
            body: step.info?.body || '',
            link: step.info?.link || '',
        })
        setStepError('')
    }

    function cancelStepEdit() {
        setEditingStepId(null)
        setStepForm(EMPTY_STEP)
        setStepError('')
    }

    async function saveStep(event) {
        event.preventDefault()
        if (!selected || stepBusy) return
        if (!stepForm.text.trim()) {
            setStepError('Step instructions are required.')
            return
        }

        setStepBusy(true)
        setStepError('')
        const payload = {
            text: stepForm.text,
            info: {
                title: stepForm.title,
                body: stepForm.body,
                link: stepForm.link,
            },
        }

        try {
            if (editingStepId) {
                await apiRequest(`/api/admin/challenges/${selected.id}/steps/${editingStepId}`, {
                    method: 'PUT',
                    body: payload,
                })
                setNotice('Module step updated.')
            } else {
                await apiRequest(`/api/admin/challenges/${selected.id}/steps`, {
                    method: 'POST',
                    body: payload,
                })
                setNotice('Module step added.')
            }
            setStepForm(EMPTY_STEP)
            setEditingStepId(null)
            await reloadSelected()
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setStepError(err.message)
        } finally {
            setStepBusy(false)
        }
    }

    async function deleteStep(step) {
        if (!window.confirm('Delete this step from the challenge?')) return
        setStepBusy(true)
        setStepError('')
        try {
            await apiRequest(`/api/admin/challenges/${selected.id}/steps/${step.id}`, { method: 'DELETE' })
            if (editingStepId === step.id) cancelStepEdit()
            await reloadSelected()
            await refresh()
            onDataChanged?.()
        } catch (err) {
            setStepError(err.message)
        } finally {
            setStepBusy(false)
        }
    }

    async function moveStep(step, direction) {
        if (!selected || stepBusy) return
        const steps = selected.steps || []
        const index = steps.findIndex((item) => item.id === step.id)
        const target = index + direction
        if (index < 0 || target < 0 || target >= steps.length) return

        const reordered = [...steps]
        const [moved] = reordered.splice(index, 1)
        reordered.splice(target, 0, moved)

        setStepBusy(true)
        try {
            await apiRequest(`/api/admin/challenges/${selected.id}/steps/reorder`, {
                method: 'PUT',
                body: { stepIds: reordered.map((item) => item.id) },
            })
            await reloadSelected()
            onDataChanged?.()
        } catch (err) {
            setStepError(err.message)
        } finally {
            setStepBusy(false)
        }
    }

    return (
        <div className="space-y-4">
            {error ? <ErrorBanner message={error} /> : null}
            <NoticeBanner message={notice} onDismiss={() => setNotice('')} />

            <Panel
                title="Challenges & modules"
                description="Create Forensics and Cryptography problems, then add ordered solve steps and Learn More notes."
                actions={<PrimaryButton onClick={openNew}>+ New challenge</PrimaryButton>}
            >
                <div className="flex flex-wrap gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title or slug…"
                        className={cx(inputClass, 'h-9 max-w-xs')}
                    />
                    <Select
                        size="sm"
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        className="max-w-[190px]"
                        containerClassName="w-full max-w-[190px]"
                    >
                        <option value="all" className="bg-[#080d0a] text-white">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-[#080d0a] text-white">{category.name}</option>
                        ))}
                    </Select>
                    <span className="ml-auto self-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                        {filtered.length} shown
                    </span>
                </div>

                {loading ? (
                    <Spinner label="Loading challenges…" />
                ) : filtered.length === 0 ? (
                    <EmptyState title="No challenges found" description="Adjust the filters or create a new challenge." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-left">
                            <thead className="border-b border-white/[0.06] bg-white/[0.012]">
                                <tr className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                                    <th className="px-4 py-2.5 font-normal sm:px-5">Challenge</th>
                                    <th className="px-3 py-2.5 font-normal">Category</th>
                                    <th className="px-3 py-2.5 font-normal">Difficulty</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Points</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Steps</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Solved</th>
                                    <th className="px-3 py-2.5 text-right font-normal">Tries</th>
                                    <th className="px-3 py-2.5 font-normal">Status</th>
                                    <th className="px-4 py-2.5 text-right font-normal sm:px-5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {filtered.map((challenge) => (
                                    <tr key={challenge.id} className="align-middle">
                                        <td className="px-4 py-3 sm:px-5">
                                            <p className="text-[12px] font-medium text-white/85">{challenge.title}</p>
                                            <p className="mt-0.5 font-mono text-[8.5px] text-muted">{challenge.slug}</p>
                                        </td>
                                        <td className="px-3 py-3 text-[10.5px] text-muted">{challenge.category_name}</td>
                                        <td className="px-3 py-3">
                                            <Badge tone={challenge.difficulty === 'easy' ? 'neon' : challenge.difficulty === 'medium' ? 'amber' : 'red'}>
                                                {challenge.difficulty}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-neon">{challenge.points}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-muted">{challenge.step_count}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-white/70">{challenge.solves}</td>
                                        <td className="px-3 py-3 text-right font-mono text-[10px] text-muted">{challenge.attempts}</td>
                                        <td className="px-3 py-3">
                                            <Badge tone={challenge.is_active ? 'neon' : 'muted'}>{challenge.is_active ? 'Published' : 'Draft'}</Badge>
                                        </td>
                                        <td className="px-4 py-3 sm:px-5">
                                            <div className="flex flex-wrap justify-end gap-1.5">
                                                <RowButton onClick={() => openChallenge(challenge, 'details')}>
                                                    Edit
                                                </RowButton>
                                                <RowButton onClick={() => openChallenge(challenge, 'modules')}>
                                                    Modules
                                                </RowButton>
                                                <RowButton onClick={() => togglePublication(challenge)}>
                                                    {challenge.is_active ? 'Unpublish' : 'Publish'}
                                                </RowButton>
                                                <button type="button" onClick={() => deleteChallenge(challenge)} className="rounded-md border border-red-400/15 px-2 py-1 text-[9.5px] text-red-300/80 hover:border-red-400/30">
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selected ? selected.title : 'New challenge'}
                description={selected ? `Challenge #${selected.id} · created ${formatDateTime(selected.created_at)}` : 'Create a problem, then add its solve modules.'}
                width="max-w-4xl"
            >
                <div className="flex gap-1 border-b border-white/[0.06] pb-3">
                    <TabButton active={tab === 'details'} onClick={() => setTab('details')}>Challenge details</TabButton>
                    <TabButton active={tab === 'modules'} onClick={() => setTab('modules')} disabled={!selected}>
                        Modules & steps {selected ? `(${selected.steps?.length || 0})` : ''}
                    </TabButton>
                </div>

                {modalError ? <div className="mt-3"><ErrorBanner message={modalError} /></div> : null}

                {tab === 'details' ? (
                    <form onSubmit={saveChallenge} className="mt-4 space-y-3.5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Challenge title">
                                <input
                                    value={form.title}
                                    onChange={(event) => {
                                        const title = event.target.value
                                        setForm((current) => ({
                                            ...current,
                                            title,
                                            slug: !selected && !slugTouched ? slugify(title) : current.slug,
                                        }))
                                    }}
                                    required
                                    maxLength={150}
                                    className={inputClass}
                                    placeholder="Cute Miming"
                                />
                            </Field>
                            <Field label="Slug" hint="URL-safe identifier">
                                <input
                                    value={form.slug}
                                    onChange={(event) => {
                                        setSlugTouched(true)
                                        setForm((current) => ({ ...current, slug: slugify(event.target.value) }))
                                    }}
                                    required
                                    maxLength={100}
                                    className={inputClass}
                                    placeholder="cute-miming"
                                />
                            </Field>
                            <Field label="Category">
                                <Select
                                    value={form.category_id}
                                    onChange={(event) => {
                                        const categoryId = event.target.value
                                        const category = categories.find(
                                            (item) => String(item.id) === String(categoryId)
                                        )
                                        setForm((current) => ({
                                            ...current,
                                            category_id: categoryId,
                                            attachment_url: categoryAllowsAttachment(category)
                                                ? current.attachment_url
                                                : '',
                                        }))
                                        setAttachmentError('')
                                        setDraggingAttachment(false)
                                    }}
                                    required
                                    disabled={attachmentBusy}
                                >
                                    <option value="" className="bg-[#080d0a] text-white">
                                        Select category
                                    </option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id} className="bg-[#080d0a] text-white">
                                            {category.name}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                            <Field label="Difficulty">
                                <Select
                                    value={form.difficulty}
                                    onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value }))}
                                >
                                    <option value="easy" className="bg-[#080d0a] text-white">Easy</option>
                                    <option value="medium" className="bg-[#080d0a] text-white">Medium</option>
                                    <option value="hard" className="bg-[#080d0a] text-white">Hard</option>
                                    <option value="insane" className="bg-[#080d0a] text-white">Insane</option>
                                </Select>
                            </Field>
                            <Field label="Points" hint="1–10000">
                                <input
                                    type="number"
                                    min="1"
                                    max="10000"
                                    value={form.points}
                                    onChange={(event) => setForm((current) => ({ ...current, points: event.target.value }))}
                                    required
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        {allowsAttachment ? (
                            <div>
                                <span className="mb-1.5 flex items-center justify-between gap-3">
                                    <span className="text-[11.5px] font-medium text-white/80">Attachment</span>
                                    <span className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
                                        Drag & drop or browse · max 25 MB
                                    </span>
                                </span>
                                <input
                                    ref={attachmentInputRef}
                                    type="file"
                                    className="sr-only"
                                    onChange={handleAttachmentInput}
                                />
                                <div
                                    onDragEnter={(event) => {
                                        event.preventDefault()
                                        setDraggingAttachment(true)
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault()
                                        event.dataTransfer.dropEffect = 'copy'
                                        setDraggingAttachment(true)
                                    }}
                                    onDragLeave={(event) => {
                                        if (!event.currentTarget.contains(event.relatedTarget)) {
                                            setDraggingAttachment(false)
                                        }
                                    }}
                                    onDrop={handleAttachmentDrop}
                                    className={cx(
                                        'rounded-xl border border-dashed p-4 transition',
                                        draggingAttachment
                                            ? 'border-neon/70 bg-neon/[0.06]'
                                            : 'border-white/10 bg-white/[0.018]',
                                        attachmentBusy ? 'opacity-70' : ''
                                    )}
                                >
                                    {attachmentError ? (
                                        <div className="mb-3">
                                            <ErrorBanner message={attachmentError} />
                                        </div>
                                    ) : null}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            {form.attachment_url ? (
                                                <>
                                                    <p className="truncate text-[11.5px] font-medium text-white/85">
                                                        {attachmentName(form.attachment_url)}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-muted">
                                                        {isUploadedAttachment(form.attachment_url)
                                                            ? 'Uploaded file is attached to this challenge.'
                                                            : 'Current attachment path is saved.'}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[11.5px] font-medium text-white/75">
                                                        {draggingAttachment ? 'Drop the file to upload' : 'Drop a file here'}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-muted">
                                                        Evidence files, archives, images, or text.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {form.attachment_url ? (
                                                <>
                                                    <SecondaryButton type="button" disabled={attachmentBusy} onClick={downloadAttachment}>
                                                        Download
                                                    </SecondaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        disabled={attachmentBusy}
                                                        onClick={() => {
                                                            setForm((current) => ({ ...current, attachment_url: '' }))
                                                            setAttachmentError('')
                                                        }}
                                                    >
                                                        Remove
                                                    </SecondaryButton>
                                                </>
                                            ) : null}
                                            <PrimaryButton
                                                type="button"
                                                disabled={attachmentBusy}
                                                onClick={() => attachmentInputRef.current?.click()}
                                            >
                                                {attachmentBusy
                                                    ? 'Uploading…'
                                                    : form.attachment_url
                                                        ? 'Replace file'
                                                        : 'Browse files'}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <Field label="Challenge description">
                            <textarea
                                value={form.description}
                                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                required
                                rows={5}
                                className={textareaClass}
                                placeholder="Describe the scenario and what students must find."
                            />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                            <Field
                                label={selected ? 'New flag' : 'Flag'}
                                hint={selected ? 'Leave blank to keep the current flag' : 'flag{...} is added automatically'}
                            >
                                <input
                                    value={form.flag}
                                    onChange={(event) => setForm((current) => ({ ...current, flag: event.target.value }))}
                                    className={inputClass}
                                    placeholder="hidden_text"
                                    autoComplete="off"
                                />
                                {flagPreview(form.flag) ? (
                                    <p className="mt-1.5 font-mono text-[9px] text-muted">
                                        Saves as <span className="text-neon/80">{flagPreview(form.flag)}</span>
                                    </p>
                                ) : null}
                            </Field>
                            <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.025] px-3">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                                    className="size-3.5 accent-[#73f76d]"
                                />
                                <span className="text-[11.5px] text-white/75">Published</span>
                            </label>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] pt-4">
                            <SecondaryButton type="button" onClick={() => setModalOpen(false)}>Close</SecondaryButton>
                            <PrimaryButton type="submit" disabled={saving || attachmentBusy}>
                                {saving ? 'Saving…' : selected ? 'Save changes' : 'Create challenge'}
                            </PrimaryButton>
                        </div>
                    </form>
                ) : (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-[12.5px] font-semibold text-white">Solve steps</h3>
                                    <p className="mt-0.5 text-[10.5px] text-muted">Ordered guidance shown in the challenge modal.</p>
                                </div>
                                <Badge tone="muted">{selected?.steps?.length || 0} steps</Badge>
                            </div>

                            {stepError ? <div className="mt-3"><ErrorBanner message={stepError} /></div> : null}

                            <div className="mt-3 space-y-2">
                                {(selected?.steps || []).length === 0 ? (
                                    <EmptyState title="No steps yet" description="Add the first step using the form on the right." />
                                ) : (
                                    selected.steps.map((step, index) => (
                                        <article key={step.id} className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-3">
                                            <div className="flex items-start gap-2.5">
                                                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-neon/30 font-mono text-[9px] text-neon">
                                                    {index + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="whitespace-pre-line text-[11.5px] leading-relaxed text-white/80">{step.text}</p>
                                                    {step.info?.title ? (
                                                        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-neon/70">
                                                            Learn more: {step.info.title}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
                                                <button type="button" onClick={() => moveStep(step, -1)} disabled={index === 0 || stepBusy} className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-muted disabled:opacity-30">↑</button>
                                                <button type="button" onClick={() => moveStep(step, 1)} disabled={index === selected.steps.length - 1 || stepBusy} className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-muted disabled:opacity-30">↓</button>
                                                <button type="button" onClick={() => startEditStep(step)} className="rounded border border-white/10 px-2 py-0.5 text-[9px] text-white/70 hover:text-neon">Edit</button>
                                                <button type="button" onClick={() => deleteStep(step)} className="rounded border border-red-400/15 px-2 py-0.5 text-[9px] text-red-300/80">Delete</button>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>

                        <form onSubmit={saveStep} className="rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
                            <h3 className="text-[12.5px] font-semibold text-white">
                                {editingStepId ? 'Edit step' : 'Add a step'}
                            </h3>
                            <p className="mt-0.5 text-[10.5px] text-muted">The Learn More fields are optional.</p>

                            <div className="mt-3 space-y-3">
                                <Field label="Step instructions">
                                    <textarea
                                        value={stepForm.text}
                                        onChange={(event) => setStepForm((current) => ({ ...current, text: event.target.value }))}
                                        rows={4}
                                        className={textareaClass}
                                        placeholder="Download the image and open it in an image viewer."
                                        required
                                    />
                                </Field>
                                <Field label="Learn More title" hint="Optional">
                                    <input
                                        value={stepForm.title}
                                        onChange={(event) => setStepForm((current) => ({ ...current, title: event.target.value }))}
                                        className={inputClass}
                                        placeholder="What is steganography?"
                                    />
                                </Field>
                                <Field label="Learn More explanation" hint="Optional">
                                    <textarea
                                        value={stepForm.body}
                                        onChange={(event) => setStepForm((current) => ({ ...current, body: event.target.value }))}
                                        rows={3}
                                        className={textareaClass}
                                        placeholder="Explain the concept in beginner-friendly language."
                                    />
                                </Field>
                                <Field label="Resource link" hint="Optional">
                                    <input
                                        value={stepForm.link}
                                        onChange={(event) => setStepForm((current) => ({ ...current, link: event.target.value }))}
                                        className={inputClass}
                                        placeholder="https://…"
                                    />
                                </Field>
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                {editingStepId ? (
                                    <SecondaryButton type="button" onClick={cancelStepEdit}>Cancel</SecondaryButton>
                                ) : null}
                                <PrimaryButton type="submit" disabled={stepBusy}>
                                    {stepBusy ? 'Saving…' : editingStepId ? 'Update step' : 'Add step'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </div>
    )
}

function TabButton({ active, children, ...props }) {
    return (
        <button
            {...props}
            type="button"
            className={cx(
                'rounded-lg px-3 py-1.5 text-[11px] font-medium transition',
                active ? 'bg-neon/[0.09] text-neon' : 'text-muted hover:bg-white/[0.04] hover:text-white',
                props.disabled ? 'cursor-not-allowed opacity-40' : ''
            )}
        >
            {children}
        </button>
    )
}



export default ChallengesSection
