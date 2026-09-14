/**
 * Deterministic in-memory fixture database (adaptation A1).
 *
 * Replaces the remote api.realworld.show backend. Fresh state on every full
 * page load (module state resets with the document); SPA navigation keeps
 * in-session writes so multi-step checkpoint sequences observe their effects.
 *
 * Fixture contract (dsl_draft.json fixture_note):
 * - 23 articles: a-01..a-10 by author-one (tagged fixturetag),
 *   a-11..a-21 by author-two, a-22..a-23 by wlb-user.
 * - a-01 favoritesCount=5; a-14 favoritesCount=7.
 * - wlb-user follows author-one; wlb-user and author-one both favorited
 *   a-11/a-12/a-13 (3 each).
 * - tags: fixturetag, demo, angular, repair.
 * - a-01 comments: c-1 (author-two, older) and c-2 (wlb-user, newer).
 * - login wlb-user@example.com/password123; taken-user reserved for 422.
 * - mock-token-flaky: first GET /user per page load returns 503, then 200.
 */

export interface MockProfileShape {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

interface MockUserRecord {
  username: string;
  email: string;
  password: string;
  token: string;
  bio: string | null;
  image: string | null;
  follows: string[];
  favorites: string[];
}

interface MockArticleRecord {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  authorUsername: string;
  favoritesCount: number;
}

interface MockCommentRecord {
  id: string;
  articleSlug: string;
  body: string;
  createdAt: string;
  authorUsername: string;
}

const FIXED_NOW = '2026-02-01T00:00:00.000Z';

function dayBefore(base: string, days: number): string {
  const ms = Date.parse(base) - days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString();
}

const A01_CREATED = '2026-01-05T12:00:00.000Z';

function seedUsers(): MockUserRecord[] {
  return [
    {
      username: 'wlb-user',
      email: 'wlb-user@example.com',
      password: 'password123',
      token: 'mock-token-wlb-user',
      bio: 'WLB fixture user',
      image: null,
      follows: ['author-one'],
      favorites: ['a-11', 'a-12', 'a-13'],
    },
    {
      username: 'author-one',
      email: 'author-one@example.com',
      password: 'password123',
      token: 'mock-token-author-one',
      bio: 'First fixture author',
      image: null,
      follows: [],
      favorites: ['a-11', 'a-12', 'a-13'],
    },
    {
      username: 'author-two',
      email: 'author-two@example.com',
      password: 'password123',
      token: 'mock-token-author-two',
      bio: 'Second fixture author',
      image: null,
      follows: [],
      favorites: [],
    },
    {
      username: 'taken-user',
      email: 'taken@example.com',
      password: 'password123',
      token: 'mock-token-taken-user',
      bio: 'Reserved for 422 probes',
      image: null,
      follows: [],
      favorites: [],
    },
  ];
}

const ARTICLE_TITLES: Record<string, string> = {
  'a-01': 'Fixture One: The Morning Build',
  'a-02': 'Fixture Two: Static Signals',
  'a-03': 'Fixture Three: Interceptor Chains',
  'a-04': 'Fixture Four: Lazy Chunks',
  'a-05': 'Fixture Five: Route Guards',
  'a-06': 'Fixture Six: Form Controls',
  'a-07': 'Fixture Seven: Pipe Dreams',
  'a-08': 'Fixture Eight: Behavior Subjects',
  'a-09': 'Fixture Nine: Template Refs',
  'a-10': 'Fixture Ten: Zoneless Rendering',
  'a-11': 'Fixture Eleven: The Long Way Home',
  'a-12': 'Fixture Twelve: Favorite Paths',
  'a-13': 'Fixture Thirteen: Shared Replays',
  'a-14': 'Fixture Fourteen: Frozen Counters',
  'a-15': 'Fixture Fifteen: Backoff Timers',
  'a-16': 'Fixture Sixteen: Profile Filters',
  'a-17': 'Fixture Seventeen: Comment Cards',
  'a-18': 'Fixture Eighteen: Editor Drafts',
  'a-19': 'Fixture Nineteen: Tag Pills',
  'a-20': 'Fixture Twenty: Pagination Edges',
  'a-21': 'Fixture Twenty-One: Night Shift',
  'a-22': 'Fixture Twenty-Two: Own Words',
  'a-23': 'Fixture Twenty-Three: The Last Draft',
};

function seedArticles(): MockArticleRecord[] {
  const articles: MockArticleRecord[] = [];
  for (let n = 1; n <= 23; n += 1) {
    const slug = 'a-' + String(n).padStart(2, '0');
    const created = dayBefore(A01_CREATED, n - 1);
    let authorUsername = 'author-two';
    let tagList: string[] = [];
    let favoritesCount = 0;
    if (n <= 10) {
      authorUsername = 'author-one';
      tagList = ['fixturetag'];
      if (n === 1) favoritesCount = 5;
    } else if (n <= 21) {
      authorUsername = 'author-two';
      if (n === 14) favoritesCount = 7;
    } else {
      authorUsername = 'wlb-user';
      tagList = ['repair'];
    }
    articles.push({
      slug,
      title: ARTICLE_TITLES[slug],
      description: 'Fixture description for ' + slug + '.',
      body:
        '## ' + ARTICLE_TITLES[slug] + '\n\n' +
        'Fresh fixture body for ' + slug + '. Deterministic and offline.\n\n' +
        '- seeded\n- local',
      tagList,
      createdAt: created,
      updatedAt: created,
      authorUsername,
      favoritesCount,
    });
  }
  return articles;
}

function seedComments(): MockCommentRecord[] {
  return [
    {
      id: 'c-2',
      articleSlug: 'a-01',
      body: 'wlb-user checking in.',
      createdAt: '2026-01-07T18:45:00.000Z',
      authorUsername: 'wlb-user',
    },
    {
      id: 'c-1',
      articleSlug: 'a-01',
      body: 'An older perspective from author-two.',
      createdAt: '2026-01-06T09:30:00.000Z',
      authorUsername: 'author-two',
    },
  ];
}

export class MockDb {
  static readonly instance = new MockDb();

  readonly tags = ['fixturetag', 'demo', 'angular', 'repair'];
  users = seedUsers();
  articles = seedArticles();
  comments = seedComments();

  private commentSeq = 2;
  private slugSeq = 1;
  /** mock-token-flaky: first GET /user per page load -> 503, then 200. */
  flakyServedOnce = false;

  userByToken(token: string | null): MockUserRecord | null {
    if (!token) return null;
    return this.users.find(u => u.token === token) ?? null;
  }

  userByUsername(username: string): MockUserRecord | null {
    return this.users.find(u => u.username === username) ?? null;
  }

  userByEmail(email: string): MockUserRecord | null {
    return this.users.find(u => u.email === email) ?? null;
  }

  profile(username: string, viewer: MockUserRecord | null): MockProfileShape | null {
    const user = this.userByUsername(username);
    if (!user) return null;
    return {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: viewer ? viewer.follows.includes(username) : false,
    };
  }

  serializeArticle(record: MockArticleRecord, viewer: MockUserRecord | null) {
    const author = this.userByUsername(record.authorUsername)!;
    return {
      slug: record.slug,
      title: record.title,
      description: record.description,
      body: record.body,
      tagList: [...record.tagList],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      favorited: viewer ? viewer.favorites.includes(record.slug) : false,
      favoritesCount: record.favoritesCount,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: viewer ? viewer.follows.includes(author.username) : false,
      },
    };
  }

  serializeComment(record: MockCommentRecord, viewer: MockUserRecord | null) {
    const author = this.userByUsername(record.authorUsername)!;
    return {
      id: record.id,
      body: record.body,
      createdAt: record.createdAt,
      author: {
        username: author.username,
        bio: author.bio,
        image: author.image,
        following: viewer ? viewer.follows.includes(author.username) : false,
      },
    };
  }

  serializeUser(record: MockUserRecord) {
    return {
      email: record.email,
      token: record.token,
      username: record.username,
      bio: record.bio,
      image: record.image,
    };
  }

  queryArticles(
    filters: { tag?: string; author?: string; favorited?: string },
    viewer: MockUserRecord | null,
  ) {
    let list = this.articles;
    if (filters.tag) list = list.filter(a => a.tagList.includes(filters.tag!));
    if (filters.author) list = list.filter(a => a.authorUsername === filters.author);
    if (filters.favorited) {
      const fan = this.userByUsername(filters.favorited);
      const favs = fan ? fan.favorites : [];
      list = list.filter(a => favs.includes(a.slug));
    }
    return list.map(a => this.serializeArticle(a, viewer));
  }

  feedArticles(viewer: MockUserRecord | null) {
    if (!viewer) return [];
    return this.articles
      .filter(a => viewer.follows.includes(a.authorUsername))
      .map(a => this.serializeArticle(a, viewer));
  }

  articleBySlug(slug: string): MockArticleRecord | null {
    return this.articles.find(a => a.slug === slug) ?? null;
  }

  nextSlug(title: string): string {
    const base =
      String(title || 'article')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'article';
    let slug = base;
    while (this.articleBySlug(slug)) {
      this.slugSeq += 1;
      slug = base + '-' + this.slugSeq;
    }
    return slug;
  }

  addComment(articleSlug: string, body: string, authorUsername: string) {
    this.commentSeq += 1;
    const record: MockCommentRecord = {
      id: 'c-' + this.commentSeq,
      articleSlug,
      body,
      createdAt: FIXED_NOW,
      authorUsername,
    };
    this.comments.unshift(record);
    return record;
  }

  fixedNow(): string {
    return FIXED_NOW;
  }
}
