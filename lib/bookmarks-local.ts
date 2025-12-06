export type LocalBookmarkRepository = {
  id: number
  name: string
  full_name: string
  description: string
  language: string
  stargazers_count: number
  forks_count: number
  topics: string[]
  html_url: string
  owner: { login: string; avatar_url: string }
  savedAt: number
}

const DB_NAME = "reposs-bookmarks"
const STORE_NAME = "bookmarks"
const DB_VERSION = 1

function isBrowser() {
  return typeof window !== "undefined" && "indexedDB" in window
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB is not available"))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("by_savedAt", "savedAt", { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"))
  })
}

export async function getAllLocalBookmarks(): Promise<LocalBookmarkRepository[]> {
  if (!isBrowser()) return []

  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result as LocalBookmarkRepository[])
    request.onerror = () => reject(request.error || new Error("Failed to read bookmarks"))
  })
}

export async function saveLocalBookmark(repo: Omit<LocalBookmarkRepository, "savedAt">) {
  if (!isBrowser()) return

  const db = await openDb()
  const now = Date.now()

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ ...repo, savedAt: now })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error || new Error("Failed to save bookmark"))
  })
}

export async function removeLocalBookmark(id: number) {
  if (!isBrowser()) return

  const db = await openDb()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error || new Error("Failed to remove bookmark"))
  })
}

export async function isLocalBookmarked(id: number): Promise<boolean> {
  if (!isBrowser()) return false

  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(!!request.result)
    request.onerror = () => reject(request.error || new Error("Failed to check bookmark"))
  })
}


