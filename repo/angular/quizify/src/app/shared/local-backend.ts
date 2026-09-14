// Offline local backend (repair-bench adaptation): deterministic
// localStorage-backed stand-ins for AngularFirestore and AngularFireAuth.
// Keeps every service/component call site unchanged while removing all
// Firebase network access. DB key: quizify_db_v1, session key:
// quizify_auth_session.
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

const DB_KEY = 'quizify_db_v1';
const SESSION_KEY = 'quizify_auth_session';

interface LocalDb {
  categories: { [id: string]: any };
  quizzes: { [id: string]: any };
  users: { [id: string]: any };
  usernames: { [id: string]: any };
  authUsers: { [email: string]: { password: string; uid: string } };
  counters: { quiz: number };
}

function seedDb(): LocalDb {
  return {
    categories: {
      cat_gen: {
        id: 'cat_gen',
        name: 'General Knowledge',
        icon: 'question-circle',
        quizzes: ['qz_1', 'qz_2'],
        promoQuiz: {
          title: 'Brain warm-up',
          subtitle: 'Test your capital knowledge in three quick questions.',
          buttonText: 'Play now',
          quizId: 'qz_1',
          background: 'linear-gradient(135deg, #1a237e 0%, #2196f3 100%)'
        }
      },
      cat_sci: { id: 'cat_sci', name: 'Science', icon: 'flask', quizzes: ['qz_3'] },
      cat_geo: { id: 'cat_geo', name: 'Geography', icon: 'globe', quizzes: [] }
    },
    quizzes: {
      qz_1: {
        name: 'Capital Cities',
        description: 'How well do you know world capitals?',
        categoryId: 'cat_gen',
        authorId: 'uid_demo',
        questions: [
          { question: 'What is the capital of France?', options: ['Berlin', 'Paris', 'Rome', 'Madrid'], answer: 1 },
          { question: 'What is the capital of Japan?', options: ['Tokyo', 'Osaka', 'Kyoto', 'Seoul'], answer: 0 },
          { question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], answer: 2 }
        ]
      },
      qz_2: {
        name: 'Math Basics',
        description: 'Quick arithmetic warm-up.',
        categoryId: 'cat_gen',
        authorId: 'uid_author2',
        questions: [
          { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], answer: 1 },
          { question: 'What is 10 - 7?', options: ['1', '2', '3', '4'], answer: 2 }
        ]
      },
      qz_3: {
        name: 'Space Explorer',
        description: 'Questions about the cosmos.',
        categoryId: 'cat_sci',
        authorId: 'uid_author2',
        questions: [
          { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
          { question: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], answer: 1 },
          { question: 'What is the largest moon of Saturn?', options: ['Titan', 'Rhea', 'Iapetus', 'Dione'], answer: 0 },
          { question: 'The Sun is mostly made of...', options: ['Helium', 'Hydrogen', 'Oxygen', 'Carbon'], answer: 1 }
        ]
      }
    },
    users: {
      uid_demo: { username: 'demo', image: 'assets/avatars/avatar_03.jpg', quizzes: ['qz_1'] },
      uid_author2: { username: 'quizmaster', image: 'assets/avatars/avatar_11.jpg', quizzes: ['qz_2', 'qz_3'] }
    },
    usernames: { demo: { uid: 'uid_demo' }, quizmaster: { uid: 'uid_author2' } },
    authUsers: { 'demo@quizify.local': { password: 'demo12345', uid: 'uid_demo' } },
    counters: { quiz: 4 }
  };
}

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw) as LocalDb;
    }
  } catch (e) {
    // fall through and reseed
  }
  const db = seedDb();
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function docSnapshot(id: string, value: any): any {
  const exists = value !== undefined && value !== null;
  return {
    id,
    exists,
    data: () => (exists ? deepCopy(value) : undefined)
  };
}

@Injectable()
export class LocalFirestore {
  collection(name: string): any {
    const readCollection = (): { [id: string]: any } => {
      const db = loadDb();
      return (db as any)[name] || {};
    };
    return {
      get(): Observable<any> {
        const table = readCollection();
        const docs = Object.keys(table).map(id => docSnapshot(id, table[id]));
        return of({ docs });
      },
      add(data: any): Promise<any> {
        const db = loadDb();
        const table = (db as any)[name];
        const id = 'qz_' + db.counters.quiz;
        db.counters.quiz = db.counters.quiz + 1;
        table[id] = deepCopy(data);
        saveDb(db);
        return Promise.resolve({ id });
      },
      doc(id: string): any {
        const readDoc = (): any => readCollection()[id];
        return {
          get(): Observable<any> {
            return of(docSnapshot(id, readDoc()));
          },
          update(data: any): Promise<void> {
            const db = loadDb();
            const table = (db as any)[name];
            if (table[id]) {
              table[id] = { ...table[id], ...deepCopy(data) };
              saveDb(db);
            }
            return Promise.resolve();
          },
          set(data: any, _options?: any): Promise<void> {
            const db = loadDb();
            const table = (db as any)[name];
            table[id] = table[id] ? { ...table[id], ...deepCopy(data) } : deepCopy(data);
            saveDb(db);
            return Promise.resolve();
          },
          delete(): Promise<void> {
            const db = loadDb();
            const table = (db as any)[name];
            delete table[id];
            saveDb(db);
            return Promise.resolve();
          },
          ref: {
            get(): Promise<any> {
              return Promise.resolve(docSnapshot(id, readDoc()));
            },
            update(data: any): Promise<void> {
              const db = loadDb();
              const table = (db as any)[name];
              if (table[id]) {
                table[id] = { ...table[id], ...deepCopy(data) };
                saveDb(db);
              }
              return Promise.resolve();
            }
          }
        };
      }
    };
  }
}

class LocalUser {
  uid: string;
  email: string;
  providerId = 'password';
  // Deterministic avatar URL. The seed's saveUser()/getImage() dereference
  // localStorage 'user' (JSON 'null' while logged out) when a user object
  // carries no photoURL; exposing one here keeps those seed paths total and
  // the signup/login flows deterministic (no Math.random avatar branch).
  photoURL = 'assets/avatars/avatar_01.jpg';
  providerData: any[] = [];
  constructor(uid: string, email: string) {
    this.uid = uid;
    this.email = email;
  }
  toJSON(): any {
    return { uid: this.uid, email: this.email, providerId: this.providerId, photoURL: this.photoURL };
  }
  sendEmailVerification(): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
export class LocalAuth {
  private state$ = new BehaviorSubject<any>(null);

  constructor() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        const db = loadDb();
        const entry = db.authUsers[session.email];
        if (entry && entry.uid === session.uid) {
          this.state$.next(new LocalUser(entry.uid, session.email));
        }
      }
    } catch (e) {
      // no session
    }
  }

  get authState(): Observable<any> {
    return this.state$.asObservable();
  }

  get currentUser(): Promise<any> {
    return Promise.resolve(this.state$.value);
  }

  private startSession(uid: string, email: string): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid, email }));
    this.state$.next(new LocalUser(uid, email));
  }

  signInWithEmailAndPassword(email: string, password: string): Promise<any> {
    const db = loadDb();
    const entry = db.authUsers[email];
    if (!entry) {
      return Promise.reject({ code: 'auth/user-not-found' });
    }
    if (entry.password !== password) {
      return Promise.reject({ code: 'auth/wrong-password' });
    }
    this.startSession(entry.uid, email);
    return Promise.resolve({ user: this.state$.value });
  }

  createUserWithEmailAndPassword(email: string, password: string): Promise<any> {
    const db = loadDb();
    if (db.authUsers[email]) {
      return Promise.reject({ code: 'auth/email-already-in-use' });
    }
    const uid = 'uid_' + email.split('@')[0];
    db.authUsers[email] = { password, uid };
    saveDb(db);
    this.startSession(uid, email);
    return Promise.resolve({ user: this.state$.value });
  }

  signInWithPopup(_provider: any): Promise<any> {
    const email = 'google.demo@quizify.local';
    const db = loadDb();
    if (!db.authUsers[email]) {
      db.authUsers[email] = { password: '', uid: 'uid_googledemo' };
      saveDb(db);
    }
    this.startSession(db.authUsers[email].uid, email);
    return Promise.resolve({ user: this.state$.value });
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    const db = loadDb();
    if (!db.authUsers[email]) {
      return Promise.reject({ code: 'auth/user-not-found' });
    }
    return Promise.resolve();
  }

  signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    this.state$.next(null);
    return Promise.resolve();
  }
}
