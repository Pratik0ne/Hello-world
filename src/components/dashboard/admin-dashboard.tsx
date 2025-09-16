'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const statusFilters = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'REWORK_REQUESTED', label: 'Rework requested' },
];

type QueueItem = {
  id: string;
  name?: string | null;
  email?: string | null;
  status: string;
  updatedAt: string;
  portfolio?: Record<string, any> | null;
  referee?: { email: string; verifiedAt: string | null } | null;
  resumeKey?: string | null;
  proofScore?: number | null;
};

type CandidateDetail = {
  candidate: {
    id: string;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    yearsExp?: number | null;
    primaryCloud?: string | null;
    tools: string[];
    status: string;
    proofScore: number;
    portfolio?: {
      kaggleUrl?: string | null;
      blogUrl?: string | null;
      siteUrl?: string | null;
    } | null;
    referee?: { email: string; verifiedAt: string | null } | null;
    reviewNotes: { id: string; message: string; createdAt: string; reviewer: { id: string; name: string | null } }[];
    resumes: {
      id: string;
      gcsKey: string;
      fileType: string;
      archived: boolean;
      uploadedAt: string;
      downloadUrl?: string;
      expiresAt?: string;
    }[];
  };
};

type Props = {
  initialQueue: QueueItem[];
  viewerRole: 'ADMIN' | 'REVIEWER';
};

export function AdminDashboard({ initialQueue, viewerRole }: Props) {
  const [filter, setFilter] = useState('SUBMITTED');
  const [queue, setQueue] = useState(initialQueue);
  const [selectedId, setSelectedId] = useState<string | null>(initialQueue[0]?.id ?? null);
  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredQueue = useMemo(() => {
    if (filter === 'ALL') return queue;
    return queue.filter((item) => item.status === filter);
  }, [filter, queue]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingDetail(true);
    fetch(`/api/admin/candidate/${selectedId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load candidate');
        const data = (await res.json()) as CandidateDetail;
        setDetail(data);
      })
      .catch((error) => {
        setActionMessage(error.message);
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  useEffect(() => {
    if (!filteredQueue.length) {
      setSelectedId(null);
      setDetail(null);
      return;
    }
    if (!selectedId || !filteredQueue.some((item) => item.id === selectedId)) {
      setSelectedId(filteredQueue[0].id);
    }
  }, [filteredQueue, selectedId]);

  async function refreshQueue() {
    const res = await fetch('/api/admin/queue');
    if (!res.ok) return;
    const data = await res.json();
    setQueue(data.candidates);
  }

  async function handleVerify() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/candidate/${selectedId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: notes || undefined }),
    });
    if (res.ok) {
      setActionMessage('Candidate verified');
      setNotes('');
      await refreshQueue();
    } else {
      const err = await res.json().catch(() => ({ error: 'Verification failed' }));
      setActionMessage(err.error || 'Verification failed');
    }
  }

  async function handleRework() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/candidate/${selectedId}/rework`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: notes }),
    });
    if (res.ok) {
      setActionMessage('Rework requested');
      setNotes('');
      await refreshQueue();
    } else {
      const err = await res.json().catch(() => ({ error: 'Rework failed' }));
      setActionMessage(err.error || 'Rework failed');
    }
  }

  async function handleReject() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/candidate/${selectedId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: rejectMessage }),
    });
    if (res.ok) {
      setActionMessage('Candidate rejected');
      setRejectMessage('');
      await refreshQueue();
    } else {
      const err = await res.json().catch(() => ({ error: 'Reject failed' }));
      setActionMessage(err.error || 'Reject failed');
    }
  }

  async function exportCsv() {
    const res = await fetch('/api/admin/queue');
    if (!res.ok) return;
    const data = await res.json();
    const header = ['id', 'name', 'email', 'status', 'proofScore'];
    const rows = data.candidates.map((c: QueueItem) => [c.id, c.name ?? '', c.email ?? '', c.status, c.proofScore ?? '']);
    const csv = [header.join(','), ...rows.map((row: any[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proofhire-de-candidates.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>Filter by status and open a profile to review artefacts.</CardDescription>
        </CardHeader>
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-indigo/20 bg-white px-3 py-2 text-sm"
          >
            {statusFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-indigo/10 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-charcoal/70">
                <th className="px-4 py-2">Candidate</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/60">
              {filteredQueue.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer bg-white hover:bg-slate ${selectedId === item.id ? 'bg-indigo/10' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{item.name ?? 'Unnamed candidate'}</p>
                    <p className="text-xs text-charcoal/70">{item.email}</p>
                  </td>
                  <td className="px-4 py-3 text-indigo">{item.status}</td>
                  <td className="px-4 py-3 text-charcoal/70">{format(new Date(item.updatedAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-xs text-charcoal/70">
                    {item.resumeKey ? 'Resume • ' : ''}
                    {item.portfolio ? 'Portfolio • ' : ''}
                    {item.referee?.verifiedAt ? 'Referee verified' : item.referee ? 'Referee invited' : 'No referee'}
                  </td>
                </tr>
              ))}
              {!filteredQueue.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-charcoal/70">
                    No candidates in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidate detail</CardTitle>
          <CardDescription>Verify resume, referee status, and leave notes for audit trail.</CardDescription>
        </CardHeader>
        <div className="space-y-4 p-6">
          {actionMessage ? <p className="text-sm text-indigo">{actionMessage}</p> : null}
          {loadingDetail && <p className="text-sm text-charcoal/70">Loading candidate…</p>}
          {detail ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-navy">{detail.candidate.name}</h3>
                <p className="text-sm text-charcoal/70">{detail.candidate.email}</p>
                <p className="text-sm text-charcoal/70">Status: {detail.candidate.status}</p>
                <p className="text-sm text-charcoal/70">Proof score: {detail.candidate.proofScore}</p>
                <p className="text-sm text-charcoal/70">
                  Tools: {detail.candidate.tools.length ? detail.candidate.tools.join(', ') : 'No tools listed'}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-navy">Resumes</h4>
                {detail.candidate.resumes.map((resume) => (
                  <div key={resume.id} className="rounded-lg border border-indigo/20 bg-slate px-3 py-2 text-sm">
                    <p className="font-medium text-charcoal">{resume.fileType}</p>
                    <p className="text-xs text-charcoal/70">Uploaded {format(new Date(resume.uploadedAt), 'dd MMM yyyy HH:mm')}</p>
                    {resume.downloadUrl ? (
                      <a
                        href={resume.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo underline"
                      >
                        Download (expires {resume.expiresAt ? format(new Date(resume.expiresAt), 'dd MMM') : ''})
                      </a>
                    ) : (
                      <span className="text-xs text-charcoal/60">Signed URL unavailable</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-navy">Portfolio</h4>
                {detail.candidate.portfolio ? (
                  <ul className="text-sm text-indigo">
                    {detail.candidate.portfolio.kaggleUrl ? (
                      <li>
                        <a href={detail.candidate.portfolio.kaggleUrl} target="_blank" rel="noreferrer" className="underline">
                          Kaggle
                        </a>
                      </li>
                    ) : null}
                    {detail.candidate.portfolio.blogUrl ? (
                      <li>
                        <a href={detail.candidate.portfolio.blogUrl} target="_blank" rel="noreferrer" className="underline">
                          Blog
                        </a>
                      </li>
                    ) : null}
                    {detail.candidate.portfolio.siteUrl ? (
                      <li>
                        <a href={detail.candidate.portfolio.siteUrl} target="_blank" rel="noreferrer" className="underline">
                          Personal site
                        </a>
                      </li>
                    ) : null}
                  </ul>
                ) : (
                  <p className="text-sm text-charcoal/70">No portfolio provided.</p>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-navy">Referee</h4>
                {detail.candidate.referee ? (
                  <p className="text-sm text-charcoal/80">
                    {detail.candidate.referee.email} ·{' '}
                    {detail.candidate.referee.verifiedAt ? 'Verified' : 'Pending verification'}
                  </p>
                ) : (
                  <p className="text-sm text-charcoal/70">No referee added.</p>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-navy">Reviewer notes</h4>
                <ul className="space-y-2 text-sm text-charcoal/80">
                  {detail.candidate.reviewNotes.length ? (
                    detail.candidate.reviewNotes.map((note) => (
                      <li key={note.id} className="rounded-lg border border-indigo/10 bg-white px-3 py-2">
                        <p>{note.message}</p>
                        <p className="text-xs text-charcoal/60">
                          {note.reviewer.name ?? 'Reviewer'} · {format(new Date(note.createdAt), 'dd MMM yyyy HH:mm')}
                        </p>
                      </li>
                    ))
                  ) : (
                    <li>No notes yet.</li>
                  )}
                </ul>
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Leave a reviewer note (visible to reviewer team only)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={handleRework} disabled={!notes.trim()}>
                    Request rework
                  </Button>
                  {viewerRole === 'ADMIN' && (
                    <Button onClick={handleVerify}>Mark verified</Button>
                  )}
                </div>
              </div>
              {viewerRole === 'ADMIN' && (
                <div className="space-y-3 rounded-lg border border-indigo/20 bg-slate p-4">
                  <p className="text-sm font-semibold text-navy">Reject candidate</p>
                  <Textarea
                    placeholder="Reason for rejection (shared internally)"
                    value={rejectMessage}
                    onChange={(event) => setRejectMessage(event.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    disabled={!rejectMessage.trim()}
                  >
                    Reject with note
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-charcoal/70">Select a candidate to view details.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
