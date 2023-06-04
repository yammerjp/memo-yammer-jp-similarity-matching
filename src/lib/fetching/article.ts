export async function fetchArticleDescriptions(): Promise<Item[]> {
  const response = await fetch('https://memo.yammer.jp/posts/index.json')
  if (!response.ok) {
        return Promise.reject(new Error("HTTP error " + response.status));
  }
  const data = await response.json()
  if (!isArticleResponse(data)) {
    return Promise.reject(new Error("Invalid data structure"));
   }
  return data.items
}

type Item = {
  id: string;
  url: string;
  title: string;
  summary: string;
  date_published: string;
  tags: string[];
};

type ArticleResponse = {
  version: string;
  version_description: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description: string;
  generator: string;
  language: string;
  copyright: string;
  lastBuildDate: string;
  items: Item[];
};

function isArticleResponse(data: any): data is ArticleResponse {
  return typeof data.version === 'string'
    && typeof data.version_description === 'string'
    && typeof data.title === 'string'
    && typeof data.home_page_url === 'string'
    && typeof data.feed_url === 'string'
    && typeof data.description === 'string'
    && typeof data.generator === 'string'
    && typeof data.language === 'string'
    && typeof data.copyright === 'string'
    && typeof data.lastBuildDate === 'string'
    && Array.isArray(data.items)
    && data.items.every(isItem);
}

function isItem(data: any): data is Item {
  return typeof data.id === 'string'
    && typeof data.url === 'string'
    && typeof data.title === 'string'
    && typeof data.summary === 'string'
    && typeof data.date_published === 'string'
    && Array.isArray(data.tags)
    && data.tags.every((tag: any) => typeof tag === 'string');
}
