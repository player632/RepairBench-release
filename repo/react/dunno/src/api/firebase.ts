// Offline adaptation: local auth + storage shim with the same exported
// surface as the original module (plus the firebase/auth helpers the
// components used to import directly). Persistence: localStorage only.
import {
  CreateUserProfileDocument,
  AddTitleFB,
  CheckTitleFB,
  MyListTitle,
  DeleteTitleFB,
  LocalUser,
} from '@/types/firebase';
import { DELAY_MS } from './fixtures';

const USERS_KEY = 'dunno:users';
const DB_KEY = 'dunno:db';
const SESSION_KEY = 'dunno:session';

interface StoredUser extends LocalUser {
  password: string;
}

interface DbShape {
  users: {
    [uid: string]: {
      profile: { [key: string]: unknown };
      titles: { [firebaseId: string]: MyListTitle };
    };
  };
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

const readUsers = (): { [email: string]: StoredUser } =>
  readJson(USERS_KEY, {});

const readDb = (): DbShape => readJson(DB_KEY, { users: {} });

const writeDb = (db: DbShape) => writeJson(DB_KEY, db);

const ensureUserSpace = (db: DbShape, uid: string): DbShape => {
  if (!db.users[uid]) db.users[uid] = { profile: {}, titles: {} };
  return db;
};

// Seed the built-in demo account (idempotent).
const seedUsers = () => {
  const users = readUsers();
  if (!users['demo@dunno.local']) {
    users['demo@dunno.local'] = {
      uid: 'u-demo',
      displayName: 'Demo User',
      email: 'demo@dunno.local',
      password: 'dunno123',
    };
    writeJson(USERS_KEY, users);
  }
};
seedUsers();

const publicUser = (user: StoredUser): LocalUser => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
});

const currentUser = (): LocalUser | null => {
  const uid = localStorage.getItem(SESSION_KEY) || '';
  if (!uid) return null;
  const users = readUsers();
  const found = Object.values(users).find((user) => user.uid === uid);
  return found ? publicUser(found) : null;
};

type AuthListener = (user: LocalUser | null) => void;
const authListeners: AuthListener[] = [];

const notifyAuth = () => {
  const snapshot = currentUser();
  authListeners.forEach((listener) => listener(snapshot));
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Placeholder for the firebase `auth` object (kept for signature parity).
export const auth: { __local: true } = { __local: true };

export const onAuthStateChanged = (
  _auth: unknown,
  listener: AuthListener
): (() => void) => {
  authListeners.push(listener);
  setTimeout(() => listener(currentUser()), 0);
  return () => {
    const index = authListeners.indexOf(listener);
    if (index >= 0) authListeners.splice(index, 1);
  };
};

export const signInWithEmailAndPassword = async (
  _auth: unknown,
  email: string,
  password: string
): Promise<{ user: LocalUser }> => {
  await wait(DELAY_MS.auth);
  const user = readUsers()[email.toLowerCase()];
  if (!user || user.password !== password) {
    throw new Error('auth/user-not-found');
  }
  localStorage.setItem(SESSION_KEY, user.uid);
  notifyAuth();
  return { user: publicUser(user) };
};

export const createUserWithEmailAndPassword = async (
  _auth: unknown,
  email: string,
  password: string
): Promise<{ user: LocalUser }> => {
  await wait(DELAY_MS.auth);
  const users = readUsers();
  const normalized = email.toLowerCase();
  if (users[normalized]) {
    throw new Error('auth/email-already-in-use');
  }
  const uid = `u-${normalized.replace(/[^a-z0-9]/g, '')}`;
  users[normalized] = {
    uid,
    displayName: null,
    email: normalized,
    password,
  };
  writeJson(USERS_KEY, users);
  localStorage.setItem(SESSION_KEY, uid);
  notifyAuth();
  return { user: publicUser(users[normalized]) };
};

export const signInWithGoogle = async (): Promise<void> => {
  await wait(DELAY_MS.auth);
  const users = readUsers();
  if (!users['google.user@dunno.local']) {
    users['google.user@dunno.local'] = {
      uid: 'u-google',
      displayName: 'Google User',
      email: 'google.user@dunno.local',
      password: '',
    };
    writeJson(USERS_KEY, users);
  }
  localStorage.setItem(SESSION_KEY, 'u-google');
  notifyAuth();
};

export const signOut = async (_auth: unknown): Promise<void> => {
  localStorage.setItem(SESSION_KEY, '');
  notifyAuth();
};

export const createUserProfileDocument: CreateUserProfileDocument = async (
  userAuth,
  additionalData
) => {
  const db = ensureUserSpace(readDb(), userAuth.uid);
  if (Object.keys(db.users[userAuth.uid].profile).length === 0) {
    db.users[userAuth.uid].profile = {
      displayName: userAuth.displayName,
      email: userAuth.email,
      createdAt: new Date().toISOString(),
      ...additionalData,
    };
    writeDb(db);
  }
  return { id: userAuth.uid };
};

export const onSnapshot = (
  ref: { id: string },
  listener: (snapshot: { id: string }) => void
): (() => void) => {
  setTimeout(() => listener({ id: ref.id }), 0);
  return () => undefined;
};

export const addTitleFB: AddTitleFB = async (
  userId,
  id,
  mediaType,
  posterPath,
  title
) => {
  try {
    await wait(DELAY_MS.auth);
    const firebaseId = Date.now().toString();
    const db = ensureUserSpace(readDb(), userId);
    db.users[userId].titles[firebaseId] = {
      id,
      mediaType,
      posterPath: posterPath || '',
      title,
      firebaseId,
    };
    writeDb(db);
    return firebaseId;
  } catch (error) {
    console.error(error);
  }
};

export const checkTitleFB: CheckTitleFB = async (userId, id, mediaType) => {
  await wait(DELAY_MS.auth);
  const db = ensureUserSpace(readDb(), userId);
  const entries = Object.values(db.users[userId].titles);
  const match = entries.find(
    (entry) => entry.id === id && entry.mediaType === mediaType
  );
  if (match) return match.firebaseId;
};

export const getTitles = async (userId: string): Promise<MyListTitle[]> => {
  await wait(DELAY_MS.auth);
  const db = ensureUserSpace(readDb(), userId);
  return Object.values(db.users[userId].titles);
};

export const deleteTitleFB: DeleteTitleFB = (userId, id) => {
  const db = ensureUserSpace(readDb(), userId);
  delete db.users[userId].titles[id];
  writeDb(db);
};
