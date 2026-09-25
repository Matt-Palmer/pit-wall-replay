type Entry = {
  value: unknown,
  expires: number
}

const MAX_STORE_SIZE = 100;

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

// ttl can depend on the loaded value, e.g. to hold an empty result only briefly
export async function cached<T>(key: string, ttl: number | ((value: T) => number), load: () => Promise<T>): Promise<T> {
  const hit = getCache<T>(key);
  if (hit !== undefined) {
    return hit;
  }
  
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const promise = load().then(result => {
    setCache(key, result, typeof ttl === "function" ? ttl(result) : ttl);
    return result;
  }).finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

function getCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCache(key: string, value: unknown, ttl: number) {
  const expires = Date.now() + ttl;
  
  if (store.size >= MAX_STORE_SIZE) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) store.delete(oldestKey);
  }

  store.set(key, { value, expires });
}