export function refereeEmailTemplate(candidateName: string, verificationUrl: string) {
  return `<!doctype html>
  <html lang="en">
  <body style="font-family:Inter,Arial,sans-serif;background:#F8FAFC;color:#1F2937;padding:24px;">
    <h2>ProofHire DE referee verification</h2>
    <p>${candidateName} has listed you as a professional referee for their Data Engineering verification.</p>
    <p>Please confirm their contributions using the secure link below:</p>
    <p><a href="${verificationUrl}" style="background:#1E3A8A;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;">Verify candidate</a></p>
    <p>This link expires in 7 days. Contact support@proofhire.in if you were not expecting this email.</p>
    <p>Regards,<br/>ProofHire DE reviewers</p>
  </body>
  </html>`;
}
