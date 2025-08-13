import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '../firebaseConfig';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'Missing idToken' });
  }
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    res.status(200).json({ user: userCredential.user });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: (error as Error).message });
  }
} 