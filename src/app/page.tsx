import Link from 'next/link';
import { ShieldCheck, FileCheck, CheckCircle, Upload } from 'lucide-react';

const highlights = [
  {
    title: 'Secure storage',
    description: 'Resumes are stored in Google Cloud Storage located in asia-south1 with signed URL access only.',
    icon: Upload,
  },
  {
    title: 'Reviewer diligence',
    description: 'Specialised reviewers validate authenticity, contact referees, and flag inconsistencies early.',
    icon: ShieldCheck,
  },
  {
    title: 'Archive-not-delete',
    description: 'Every resume revision is archived for traceability. Candidates keep control of their history.',
    icon: FileCheck,
  },
  {
    title: 'Transparent status',
    description: 'See when you are submitted, under review, or verified in real time—no hidden queues.',
    icon: CheckCircle,
  },
];

export default function LandingPage() {
  return (
    <main className="bg-slate">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-16 text-charcoal">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-indigo/10 px-4 py-2 text-sm font-semibold text-indigo">
            Proof-first hiring for Data Engineers
          </span>
          <h1 className="text-4xl font-bold text-navy sm:text-5xl">
            Authentic Data Engineering talent, verified in India.
          </h1>
          <p className="max-w-2xl text-lg text-charcoal/80">
            ProofHire DE is the candidate-only verification lane tailored for India-based Data Engineers. We combine secure
            resume ingestion, optional portfolio evidence, and referee corroboration to help reviewers validate your impact.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="rounded-full bg-indigo px-6 py-3 text-base font-semibold text-slate shadow-lg shadow-indigo/20 transition hover:bg-navy"
            >
              Get Verified
            </Link>
            <p className="text-sm text-charcoal/70">
              Built for candidates across India · INR-first processes · Privacy-first controls
            </p>
          </div>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-navy">Why verification matters</h2>
          <p className="mt-4 max-w-3xl text-base text-charcoal/80">
            Hiring teams struggle to validate complex Data Engineering experience. ProofHire DE brings reviewers, tooling, and
            infrastructure security to showcase credible professionals. Verified candidates progress faster to interviews with
            trusted hiring partners once the employer portal launches.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="flex h-full flex-col rounded-xl border border-slate/50 bg-slate p-6 shadow-sm">
                <item.icon className="h-10 w-10 text-indigo" />
                <h3 className="mt-4 text-xl font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm text-charcoal/80">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-navy">What we collect</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            <li className="rounded-lg border border-indigo/20 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo">Resume evidence</h3>
              <p className="mt-2 text-sm text-charcoal/80">
                Upload a PDF or DOCX up to 10MB. Each version is archived, never deleted. We use signed Google Cloud Storage
                URLs and antivirus scanning stubs on ingestion.
              </p>
            </li>
            <li className="rounded-lg border border-indigo/20 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo">Portfolio signals</h3>
              <p className="mt-2 text-sm text-charcoal/80">
                Share Kaggle, Medium, or personal sites that demonstrate data pipelines, warehousing, and analytics projects.
              </p>
            </li>
            <li className="rounded-lg border border-indigo/20 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo">Optional referee</h3>
              <p className="mt-2 text-sm text-charcoal/80">
                Invite a work email referee. We send a secure Resend link to confirm your contributions. Verified referees boost
                your proof score.
              </p>
            </li>
            <li className="rounded-lg border border-indigo/20 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo">India privacy note</h3>
              <p className="mt-2 text-sm text-charcoal/80">
                Data is processed in India. We comply with DPDP expectations for consent, provide audit logs, and support future
                export/delete requests.
              </p>
            </li>
          </ul>
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-semibold text-navy">How review works</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate/40 p-6">
              <span className="text-sm font-medium text-indigo">1. Intake</span>
              <p className="mt-3 text-sm text-charcoal/80">Submit your essentials in under ten minutes, with optional referee outreach.</p>
            </div>
            <div className="rounded-xl border border-slate/40 p-6">
              <span className="text-sm font-medium text-indigo">2. Human review</span>
              <p className="mt-3 text-sm text-charcoal/80">
                Reviewers evaluate resume chronology, data stack alignment, and cross-reference referee statements. Automated
                heuristics surface flags for attention.
              </p>
            </div>
            <div className="rounded-xl border border-slate/40 p-6">
              <span className="text-sm font-medium text-indigo">3. Verification</span>
              <p className="mt-3 text-sm text-charcoal/80">
                Once approved, your profile is marked Verified. You&apos;ll receive next steps when employer matching goes live.
              </p>
            </div>
          </div>
          <div className="mt-10 rounded-lg border border-teal/40 bg-teal/10 p-6 text-sm text-charcoal/80">
            Trust badges: Google Cloud Storage signed uploads · Reviewer-only access · Archive-not-delete history
          </div>
        </div>
      </section>
    </main>
  );
}
