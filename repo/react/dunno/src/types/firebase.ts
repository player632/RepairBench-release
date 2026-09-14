// Offline adaptation: local types replacing the firebase SDK types.
export interface LocalUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export type CreateUserProfileDocument = (
  userAuth: LocalUser,
  additionalData?: object
) => Promise<{ id: string }>;

export type AddTitleFB = (
  userId: string,
  id: string,
  mediaType: string,
  posterPath: string | null,
  title: string
) => Promise<string | undefined>;

export type CheckTitleFB = (
  userId: string,
  id: string,
  mediaType: string
) => Promise<string | undefined>;

export interface MyListTitle {
  id: string;
  title: string;
  mediaType: string;
  posterPath: string;
  firebaseId: string;
}

export type DeleteTitleFB = (userId: string, id: string) => void;
