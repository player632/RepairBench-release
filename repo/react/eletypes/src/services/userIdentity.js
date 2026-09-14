const USER_ID_KEY = "eletypes-user-id";
const USER_NAME_KEY = "eletypes-user-name";

const generateUserId = () => {
  return "user_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
};

export const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

export const getUserName = () => {
  return localStorage.getItem(USER_NAME_KEY) || "";
};

export const setUserName = (name) => {
  localStorage.setItem(USER_NAME_KEY, name);
};

// Simple hash to generate a short tag without exposing raw identifiers
const hashToTag = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 0xffff).toString(16).padStart(4, "0");
};

export const getUserTag = (identifier) => {
  const id = identifier || getUserId();
  return "#" + hashToTag(id);
};
