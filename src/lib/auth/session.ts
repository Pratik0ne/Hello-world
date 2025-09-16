import { getServerSession } from 'next-auth';
import { authOptions } from './options';

export function auth() {
  return getServerSession(authOptions);
}
