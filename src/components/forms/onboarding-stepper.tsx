'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stepper } from '@/components/ui/stepper';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const toolOptions = ['Airflow', 'dbt', 'Spark', 'Kafka', 'BigQuery', 'Snowflake', 'Redshift', 'Databricks'];

const basicSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^(\+91)?[6-9][0-9]{9}$/g, 'Enter a valid +91 mobile number'),
  yearsExp: z.coerce.number().min(0).max(50),
  primaryCloud: z.enum(['GCP', 'AWS', 'Azure']),
  tools: z.array(z.string()).min(1, 'Select at least one tool'),
});

type BasicValues = z.infer<typeof basicSchema>;

const portfolioSchema = z.object({
  kaggleUrl: z.string().url().optional().or(z.literal('')),
  blogUrl: z.string().url().optional().or(z.literal('')),
  siteUrl: z.string().url().optional().or(z.literal('')),
});
type PortfolioValues = z.infer<typeof portfolioSchema>;

const refereeSchema = z.object({ email: z.string().email().optional().or(z.literal('')) });
type RefereeValues = z.infer<typeof refereeSchema>;

const steps = [
  { title: 'Basics', description: 'Contact & experience' },
  { title: 'Resume', description: 'Upload PDF/DOCX' },
  { title: 'Portfolio', description: 'Optional links' },
  { title: 'Referee', description: 'Optional verification' },
  { title: 'Review', description: 'Consent & submit' },
];

type Resume = {
  id: string;
  gcsKey: string;
  uploadedAt: string;
  archived: boolean;
  fileType: string;
};

type Candidate = {
  id: string;
  phone?: string | null;
  yearsExp?: number | null;
  primaryCloud?: string | null;
  tools: string[];
  status: string;
  proofScore?: number | null;
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
  userName?: string | null;
  candidate: Candidate;
};

export function OnboardingStepper({ candidate: initialCandidate, userName }: Props) {
  const [candidate, setCandidate] = useState(initialCandidate);
  const [activeStep, setActiveStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const basicForm = useForm<BasicValues>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      name: userName ?? '',
      phone: candidate.phone ?? '',
      yearsExp: candidate.yearsExp ?? 0,
      primaryCloud: (candidate.primaryCloud as BasicValues['primaryCloud']) ?? 'GCP',
      tools: candidate.tools?.length ? candidate.tools : [],
    },
  });

  const portfolioForm = useForm<PortfolioValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      kaggleUrl: candidate.portfolio?.kaggleUrl ?? '',
      blogUrl: candidate.portfolio?.blogUrl ?? '',
      siteUrl: candidate.portfolio?.siteUrl ?? '',
    },
  });

  const refereeForm = useForm<RefereeValues>({
    resolver: zodResolver(refereeSchema),
    defaultValues: {
      email: candidate.referee?.email ?? '',
    },
  });

  const watchedTools = basicForm.watch('tools') ?? [];

  async function updateProfile(payload: Partial<BasicValues> & { submit?: boolean }) {
    const res = await fetch('/api/me/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || 'Failed to update');
    }
    const data = await res.json();
    setCandidate((prev) => ({ ...prev, ...(data.candidate ?? {}) }));
  }

  async function submitBasics(values: BasicValues) {
    setStatusMessage(null);
    try {
      await updateProfile(values);
      setStatusMessage('Basics saved');
      setActiveStep(1);
    } catch (error: any) {
      setStatusMessage(error.message);
    }
  }

  async function handleResumeUpload(file: File) {
    setUploading(true);
    setResumeMessage('Uploading resume…');
    try {
      const payload = { fileType: file.type, fileSize: file.size };
      const response = await fetch('/api/resume/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Failed to generate upload URL');
      }
      const signed = await response.json();
      await fetch(signed.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      setResumeMessage('Resume uploaded securely.');
      setCandidate((prev) => ({
        ...prev,
        resumes: [
          {
            id: signed.resumeId ?? signed.gcsKey,
            gcsKey: signed.gcsKey,
            fileType: file.type,
            archived: false,
            uploadedAt: new Date().toISOString(),
          },
          ...(prev.resumes ?? []).map((resume) => ({ ...resume, archived: true })),
        ],
      }));
      setActiveStep(2);
    } catch (error: any) {
      setResumeMessage(error.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submitPortfolio(values: PortfolioValues) {
    setStatusMessage(null);
    try {
      const res = await fetch('/api/portfolio/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Could not save portfolio' }));
        throw new Error(err.error || 'Could not save portfolio');
      }
      setCandidate((prev) => ({
        ...prev,
        portfolio: {
          kaggleUrl: values.kaggleUrl || null,
          blogUrl: values.blogUrl || null,
          siteUrl: values.siteUrl || null,
        },
      }));
      setStatusMessage('Portfolio saved');
      setActiveStep(3);
    } catch (error: any) {
      setStatusMessage(error.message || 'Could not save portfolio');
    }
  }

  async function submitReferee(values: RefereeValues) {
    setStatusMessage(null);
    if (!values.email) {
      setActiveStep(4);
      return;
    }
    try {
      const res = await fetch('/api/referee/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Referee request failed' }));
        throw new Error(err.error || 'Referee request failed');
      }
      setCandidate((prev) => ({
        ...prev,
        referee: {
          email: values.email!,
          verifiedAt: null,
          requestedAt: new Date().toISOString(),
        },
      }));
      setStatusMessage('Referee email sent');
      setActiveStep(4);
    } catch (error: any) {
      setStatusMessage(error.message || 'Referee request failed');
    }
  }

  async function handleSubmitApplication() {
    if (!consentChecked) {
      setStatusMessage('Please provide consent before submitting.');
      return;
    }
    setSubmitLoading(true);
    setStatusMessage(null);
    try {
      await updateProfile({ submit: true });
      setCandidate((prev) => ({ ...prev, status: 'SUBMITTED' }));
      setStatusMessage('Profile submitted for review.');
    } catch (error: any) {
      setStatusMessage(error.message || 'Submission failed');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={steps} activeStep={activeStep} />
      {statusMessage ? <p className="text-sm text-indigo">{statusMessage}</p> : null}

      {activeStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Candidate basics</CardTitle>
            <CardDescription>We use these details to contact you during reviewer follow-ups.</CardDescription>
          </CardHeader>
          <form className="space-y-6" onSubmit={basicForm.handleSubmit(submitBasics)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" {...basicForm.register('name')} placeholder="As per PAN" />
                {basicForm.formState.errors.name ? (
                  <p className="mt-1 text-xs text-indigo">{basicForm.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="phone">Mobile (+91)</Label>
                <Input id="phone" {...basicForm.register('phone')} placeholder="+9198xxxxxxx" />
                {basicForm.formState.errors.phone ? (
                  <p className="mt-1 text-xs text-indigo">{basicForm.formState.errors.phone.message}</p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="yearsExp">Years of experience</Label>
                <Input id="yearsExp" type="number" min={0} max={50} {...basicForm.register('yearsExp', { valueAsNumber: true })} />
                {basicForm.formState.errors.yearsExp ? (
                  <p className="mt-1 text-xs text-indigo">{basicForm.formState.errors.yearsExp.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="primaryCloud">Primary cloud</Label>
                <select
                  id="primaryCloud"
                  className="w-full rounded-lg border border-indigo/30 bg-white px-3 py-2 text-sm"
                  {...basicForm.register('primaryCloud')}
                >
                  <option value="GCP">Google Cloud Platform</option>
                  <option value="AWS">Amazon Web Services</option>
                  <option value="Azure">Microsoft Azure</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Key Data Engineering tools</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {toolOptions.map((tool) => {
                  const checked = watchedTools.includes(tool);
                  return (
                    <label key={tool} className="flex items-center gap-3 rounded-lg border border-indigo/20 bg-slate px-3 py-2">
                      <input
                        type="checkbox"
                        value={tool}
                        checked={checked}
                        onChange={(event) => {
                          const current = new Set(basicForm.getValues('tools'));
                          if (event.target.checked) {
                            current.add(tool);
                          } else {
                            current.delete(tool);
                          }
                          basicForm.setValue('tools', Array.from(current));
                        }}
                      />
                      <span className="text-sm text-charcoal">{tool}</span>
                    </label>
                  );
                })}
              </div>
              {basicForm.formState.errors.tools ? (
                <p className="mt-1 text-xs text-indigo">{basicForm.formState.errors.tools.message}</p>
              ) : null}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="submit">Save & continue</Button>
            </div>
          </form>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Secure resume upload</CardTitle>
            <CardDescription>
              Upload a PDF or DOCX up to 10MB. Every revision is archived under the ProofHire DE archive-not-delete policy.
            </CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <Label htmlFor="resume">Resume file</Label>
            <Input
              id="resume"
              type="file"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleResumeUpload(file);
                }
              }}
            />
            {resumeMessage ? <p className="text-sm text-indigo">{resumeMessage}</p> : null}
            <Button variant="secondary" onClick={() => setActiveStep(2)} disabled={uploading}>
              Skip for now
            </Button>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-navy">Previous uploads</h4>
              <div className="space-y-2">
                {candidate.resumes?.length ? (
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
          </div>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio evidence (optional)</CardTitle>
            <CardDescription>Add work that supports your claims. Reviewers check authenticity before weighting them.</CardDescription>
          </CardHeader>
          <form className="space-y-4" onSubmit={portfolioForm.handleSubmit(submitPortfolio)}>
            <div>
              <Label htmlFor="kaggleUrl">Kaggle profile</Label>
              <Input id="kaggleUrl" placeholder="https://www.kaggle.com/username" {...portfolioForm.register('kaggleUrl')} />
            </div>
            <div>
              <Label htmlFor="blogUrl">Medium or blog</Label>
              <Input id="blogUrl" placeholder="https://medium.com/@you" {...portfolioForm.register('blogUrl')} />
            </div>
            <div>
              <Label htmlFor="siteUrl">Personal site</Label>
              <Input id="siteUrl" placeholder="https://proofhire.dev" {...portfolioForm.register('siteUrl')} />
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button type="submit">Save & continue</Button>
            </div>
          </form>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Referee (optional)</CardTitle>
            <CardDescription>Provide a work email for a manager or peer who can confirm your contributions.</CardDescription>
          </CardHeader>
          <form className="space-y-4" onSubmit={refereeForm.handleSubmit(submitReferee)}>
            <div>
              <Label htmlFor="refereeEmail">Referee work email</Label>
              <Input id="refereeEmail" placeholder="referee@company.com" {...refereeForm.register('email')} />
            </div>
            {candidate.referee ? (
              <div className="rounded-lg border border-indigo/20 bg-slate px-3 py-2 text-sm text-charcoal/80">
                {candidate.referee.verifiedAt ? (
                  <span>Referee verified {formatDistanceToNow(new Date(candidate.referee.verifiedAt), { addSuffix: true })}</span>
                ) : (
                  <span>Verification email sent to {candidate.referee.email}. Pending confirmation.</span>
                )}
              </div>
            ) : null}
            <div className="flex justify-between">
              <Button variant="secondary" type="button" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button type="submit">Save & continue</Button>
            </div>
          </form>
        </Card>
      )}

      {activeStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & submit</CardTitle>
            <CardDescription>Check what reviewers will see before submitting for verification.</CardDescription>
          </CardHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-indigo/20 bg-slate p-4">
              <h4 className="text-sm font-semibold text-navy">Summary</h4>
              <p className="mt-1 text-sm text-charcoal/80">Experience: {candidate.yearsExp ?? '—'} years</p>
              <p className="text-sm text-charcoal/80">Primary cloud: {candidate.primaryCloud ?? '—'}</p>
              <p className="text-sm text-charcoal/80">Tools: {candidate.tools?.join(', ') || '—'}</p>
              <p className="text-sm text-charcoal/80">
                Resume: {candidate.resumes?.length ? `${candidate.resumes.filter((r) => !r.archived).length} active` : 'Not uploaded'}
              </p>
              <p className="text-sm text-charcoal/80">
                Portfolio: {candidate.portfolio && (candidate.portfolio.blogUrl || candidate.portfolio.kaggleUrl || candidate.portfolio.siteUrl)
                  ? 'Provided'
                  : 'Not provided'}
              </p>
              <p className="text-sm text-charcoal/80">
                Referee: {candidate.referee ? (candidate.referee.verifiedAt ? 'Verified' : 'Invited') : 'Not added'}
              </p>
            </div>
            <div className="rounded-lg border border-indigo/20 bg-white p-4">
              <p className="text-sm text-charcoal/80">
                By submitting you consent to ProofHire DE processing your personal data in India for verification purposes and
                to secure storage of your resume on Google Cloud Storage in asia-south1.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-charcoal/80">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(event) => setConsentChecked(event.target.checked)}
                />
                <label htmlFor="consent">I consent to data processing in India and archive-not-delete retention.</label>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" type="button" onClick={() => setActiveStep(3)}>
                  Back
                </Button>
                <Button type="button" onClick={handleSubmitApplication} disabled={submitLoading}>
                  {submitLoading ? 'Submitting…' : 'Submit for review'}
                </Button>
              </div>
            </div>
            {candidate.status !== 'SUBMITTED' ? (
              <p className="text-xs text-charcoal/60">Status: {candidate.status}</p>
            ) : (
              <Badge>Status: Submitted</Badge>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
