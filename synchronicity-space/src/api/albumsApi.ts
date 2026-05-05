import { API_BASE_URL } from "../App";

export const fetchAlbums = async () => {
  const response = await fetch(`${API_BASE_URL}/albums`);
  return response.json();
};