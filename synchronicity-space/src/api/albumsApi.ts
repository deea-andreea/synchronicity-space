import { API_BASE_URL } from "../config";

export const fetchAlbums = async () => {
  const response = await fetch(`${API_BASE_URL}/albums`);
  return response.json();
};