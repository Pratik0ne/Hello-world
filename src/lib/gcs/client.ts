import { Storage } from '@google-cloud/storage';

const projectId = process.env.GCS_PROJECT_ID;
const clientEmail = process.env.GCS_CLIENT_EMAIL;
const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.warn('GCS credentials are not fully configured. Signed URLs will be unavailable.');
}

export const storage = new Storage({
  projectId,
  credentials: clientEmail && privateKey ? { client_email: clientEmail, private_key: privateKey } : undefined,
});

export const bucketName = process.env.GCS_BUCKET ?? 'proofhire-de-resumes';
