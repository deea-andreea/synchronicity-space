import { API_BASE_URL } from "../config";

// Fetch catalog albums with optional search query and pagination params
export const fetchAlbums = async (params?: { limit?: number; offset?: number; search?: string }) => {
  let url = `${API_BASE_URL}/albums`;
  const queryParams: string[] = [];

  if (params) {
    if (params.limit !== undefined) queryParams.push(`limit=${params.limit}`);
    if (params.offset !== undefined) queryParams.push(`offset=${params.offset}`);
    if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch albums catalog");
  }
  return response.json();
};

// Fetch user's library albums
export const fetchLibraryAlbums = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/albums/library`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user library");
  }
  return response.json();
};

// Add album to user's library
export const addAlbumToLibrary = async (token: string, albumId: string) => {
  const response = await fetch(`${API_BASE_URL}/albums/library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ albumId })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add album to library");
  }
  return response.json();
};

// Remove album from user's library
export const removeAlbumFromLibrary = async (token: string, albumId: string) => {
  const response = await fetch(`${API_BASE_URL}/albums/library/${albumId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to remove album from library");
  }
  return response.json();
};