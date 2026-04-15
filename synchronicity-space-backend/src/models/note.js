import { z } from "zod";
import { randomUUID } from "crypto";

export const NoteCreateSchema = z.object({
    userId: z.string().min(1, "userId is required"),
    trackId: z.string().min(1, "trackId is required"),
    albumId: z.string().min(1, "albumId is required"),
    text: z
        .string()
        .transform((val) => val.trim())
        .pipe(
            z
                .string()
                .min(5, "Note must have at least 5 characters")
                .max(100, "Note must have at most 100 characters")
        )

});

export const NoteUpdateSchema = z.object({
    text: z
        .string()
        .transform((val) => val.trim())
        .pipe(
            z
                .string()
                .min(5, "Note must have at least 5 characters")
                .max(100, "Note must have at most 100 characters")
        )
});

export function createNote(validatedData) {
    return {
        id: randomUUID(),
        userId: validatedData.userId,
        trackId: validatedData.trackId,
        albumId: validatedData.albumId,
        text: validatedData.text,
        createdAt: new Date().toISOString(),
    };
}