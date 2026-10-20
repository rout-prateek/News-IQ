let pending = "";
let pendingArticle: any = null;
const KEY = "newsiq:q";
const ARTICLE_KEY = "newsiq:article";

export function setQuery(q: string) {
  pending = q;
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, q);
}

export function readQuery() {
  if (typeof window !== "undefined") return sessionStorage.getItem(KEY) ?? pending;
  return pending;
}

export function setContextArticle(art: any) {
  pendingArticle = art;
  if (typeof window !== "undefined") {
    if (art) {
      sessionStorage.setItem(ARTICLE_KEY, JSON.stringify(art));
    } else {
      sessionStorage.removeItem(ARTICLE_KEY);
    }
  }
}

export function readContextArticle() {
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(ARTICLE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return pendingArticle;
      }
    }
  }
  return pendingArticle;
}
