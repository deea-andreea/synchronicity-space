import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "./HomePage";
import { describe, expect, test, vi } from "vitest";
import { updateNoteCount } from "../utils/tracking";

// ✅ Mock tracking
vi.mock("../utils/tracking", () => ({
  trackListening: vi.fn(),
  updateNoteCount: vi.fn(),
}));

const mockAlbum = {
    id: "2",
    title: "Album 2",
    artist: "Artist 2",
    genre: "Pop",
    year: 1977,
    coverImage: "/covers/asfalt.png",
    description: "A classic album with rich harmonies and emotional songwriting.",
    tracks: [
      { id: "1-1", title: "Track 1", trackNumber: 1 },
      { id: "1-2", title: "Track 2", trackNumber: 2 },
      { id: "1-3", title: "Track 3", trackNumber: 3 }
    ],
};

const defaultProps = {
  albums: [mockAlbum],
  activeAlbum: mockAlbum,
  onPlayAlbum: vi.fn(),
};

describe("Notes functionality (Vitest)", () => {
  test("adds a new note", () => {
    render(<HomePage {...defaultProps} />);

    // Open notes overlay
    fireEvent.click(screen.getByAltText("note"));

    const textarea = screen.getByPlaceholderText(/my thoughts/i);
    fireEvent.change(textarea, { target: { value: "My test note" } });

    fireEvent.click(screen.getByText("+"));

    expect(screen.getByText(/My test note/i)).toBeInTheDocument();
    expect(updateNoteCount).toHaveBeenCalledWith(1);
  });

  test("deletes a note", () => {
    render(<HomePage {...defaultProps} />);

    fireEvent.click(screen.getByAltText("note"));

    const textarea = screen.getByPlaceholderText(/my thoughts/i);
    fireEvent.change(textarea, { target: { value: "Delete me" } });
    fireEvent.click(screen.getByText("+"));

    fireEvent.click(screen.getByText(/Delete me/i));

    fireEvent.click(screen.getByText("Delete"));

    expect(screen.queryByText(/Delete me/i)).not.toBeInTheDocument();
    expect(updateNoteCount).toHaveBeenCalledWith(-1);
  });

  test("edits a note", () => {
    render(<HomePage {...defaultProps} />);

    fireEvent.click(screen.getByAltText("note"));

    const textarea = screen.getByPlaceholderText(/my thoughts/i);
    fireEvent.change(textarea, { target: { value: "Old text" } });
    fireEvent.click(screen.getByText("+"));

    fireEvent.click(screen.getByText(/Old text/i));

    fireEvent.click(screen.getByText("Edit"));

    const editTextarea = screen.getByDisplayValue("Old text");
    fireEvent.change(editTextarea, { target: { value: "Updated text" } });

    fireEvent.click(screen.getByText("Save"));
    
    expect(screen.getAllByText(/Updated text/i).length).toBeGreaterThan(0);
  });
});