import { useEffect, useRef } from "react";
import type { Note } from "../models/Note";

export function useNoteSocket(onNewNotes: (notes: Note[]) => void) {
  const callbackRef = useRef(onNewNotes);
  callbackRef.current = onNewNotes;

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "MOCK_NOTES") callbackRef.current(msg.notes);
      } catch {  }
    };

    return () => ws.close();
  }, []);
}