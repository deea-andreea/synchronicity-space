export type PendingOperation =
    | { type: "CREATE"; tempId: string; data: { userId: string; trackId: string; albumId: string; text: string } }
    | { type: "UPDATE"; noteId: string; text: string; requestingUserId: string }
    | { type: "DELETE"; noteId: string; requestingUserId: string };

const KEY = "offline-queue";

export function getQueue(): PendingOperation[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? "[]");

    }catch {
        return [];
    }
}

export function enqueue(operation: PendingOperation): void {
    const queue = getQueue();
    queue.push(operation);
    localStorage.setItem(KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
    localStorage.removeItem(KEY);
}

export function isOnline(): boolean {
    return navigator.onLine;
}