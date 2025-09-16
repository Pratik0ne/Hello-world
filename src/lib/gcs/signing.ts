import { bucketName, storage } from './client';

type SignedUrlResponse = {
  gcsKey: string;
  url: string;
  expiresAt: Date;
};

const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;

function extensionFromMime(mime: string) {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'application/msword':
      return 'doc';
    default:
      throw new Error('Unsupported file type');
  }
}

export async function generateResumeUploadUrl(candidateId: string, mimeType: string): Promise<SignedUrlResponse> {
  const ext = extensionFromMime(mimeType);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const gcsKey = `uploads/${candidateId}/${timestamp}.${ext}`;
  const file = storage.bucket(bucketName).file(gcsKey);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + sevenDaysMs,
    contentType: mimeType,
  });
  return { gcsKey, url, expiresAt: new Date(Date.now() + sevenDaysMs) };
}

export async function generateResumeDownloadUrl(gcsKey: string): Promise<SignedUrlResponse> {
  const file = storage.bucket(bucketName).file(gcsKey);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + sevenDaysMs,
  });
  return { gcsKey, url, expiresAt: new Date(Date.now() + sevenDaysMs) };
}

export async function moveResumeToArchive(gcsKey: string): Promise<string> {
  if (gcsKey.startsWith('archive/')) {
    return gcsKey;
  }
  const [candidatePrefix, ...rest] = gcsKey.replace('uploads/', '').split('/');
  const filename = rest.join('/');
  const destinationKey = `archive/${candidatePrefix}/${filename}`;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(gcsKey);
  await bucket.file(destinationKey).exists().then(async ([exists]) => {
    if (exists) {
      await bucket.file(destinationKey).delete();
    }
  });
  await file.move(destinationKey);
  return destinationKey;
}

export async function virusScanStub(_gcsKey: string) {
  if (process.env.NODE_ENV === 'development') {
    console.info('Virus scan stub executed for', _gcsKey);
  }
}
