'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const statusCopy: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REWORK_REQUESTED: 'Rework requested',
  REJECTED: 'Not approved',
};

type Resume = {
  id: string;
  gcsKey: string;
  archived: boolean;
  fileType: string;
  uploadedAt: string;
};

type Candidate = {
  id: string;
  status: string;
  resumes: Resume[];
  portfolio?: {
    kaggleUrl?: string | null;
    blogUrl?: string | null;
    siteUrl?: string | null;
  } | null;
  referee?: {
    email: string;
    verifiedAt: string | null;
    requestedAt: string;
  } | null;
};

type Props = {
  candidate: Candidate;
};

export function CandidateDashboard({ candidate: initialCandidate }: Props) {
  const [candidate, setCandidate] = useState(initialCandidate);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasPortfolio = Boolean(
    candidate.portfolio?.blogUrl || candidate.portfolio?.kaggleUrl || candidate.portfolio?.siteUrl
  );
  const resumeCount = candidate.resumes.filter((resume) => !resume.archived).length;

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setMessage('Uploading resume…');
    try {
      const res = await fetch('/api/resume/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: file.type, fileSize: file.size }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Failed to generate signed URL');
      }
      const signed = await res.json();
      await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setCandidate((prev) => ({
        ...prev,
        resumes: [
          {
            id: signed.resumeId ?? signed.gcsKey,
            gcsKey: signed.gcsKey,
            archived: false,
            fileType: file.type,
            uploadedAt: new Date().toISOString(),
          },
          ...(prev.resumes ?? []).map((resume) => ({ ...resume, archived: true })),
        ],
      }));
      setMessage('Resume uploaded successfully. Reviewers will use the latest version.');
    } catch (error: any) {
      setMessage(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const tips: string[] = [];
  if (!hasPortfolio) tips.push('Add portfolio links to strengthen your proof.');
  if (!candidate.referee) tips.push('Invite a referee with a work email for an authenticity boost.');
  if (!resumeCount) tips.push('Upload at least one resume to move past draft status.');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your verification status</CardTitle>
          <CardDescription>Status updates happen in real time once reviewers act on your profile.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <p className="text-lg font-semibold text-indigo">{statusCopy[candidate.status] ?? candidate.status}</p>
          <p className="text-sm text-charcoal/80">
            Need changes? Continue onboarding to update details or add more signals.
          </p>
          <Button asChild variant="secondary">
            <Link href="/onboarding">Continue onboarding</Link>
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume archive</CardTitle>
          <CardDescription>Re-upload anytime. Previous versions remain in secure archive per policy.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Label htmlFor="resumeUpload">Upload new resume</Label>
          <Input
            id="resumeUpload"
            type="file"
            accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleResumeUpload(file);
              }
            }}
          />
          {message ? <p className="text-sm text-indigo">{message}</p> : null}
          <div className="space-y-2">
            {candidate.resumes.length ? (
              candidate.resumes.map((resume) => (
                <div key={resume.id} className="flex items-center justify-between rounded-lg border border-indigo/20 bg-slate px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-charcoal">{resume.fileType}</p>
                    <p className="text-xs text-charcoal/70">
                      Uploaded {formatDistanceToNow(new Date(resume.uploadedAt), { addSuffix: true })}
                      {resume.archived ? ' · archived' : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-charcoal/70">No resume uploaded yet.</p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips to strengthen your profile</CardTitle>
          <CardDescription>Each tip aligns with reviewer expectations for Data Engineering roles.</CardDescription>
        </CardHeader>
        <ul className="space-y-2 text-sm text-charcoal/80">
          {tips.length ? tips.map((tip) => <li key={tip}>• {tip}</li>) : <li>Great job! Reviewers will reach out if they need more details.</li>}
        </ul>
      </Card>
    </div>
  );
}
