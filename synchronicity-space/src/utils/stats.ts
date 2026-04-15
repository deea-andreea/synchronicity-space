import { getCookie , setCookie} from "../utils/cookies";

export const getTopGenres = (history: any[]) => {
  const counts: Record<string, number> = {};
  const seenAlbums = new Set<string>();

  history.forEach(entry => {
    if (entry.id && !seenAlbums.has(entry.id)) {
      counts[entry.genre] = (counts[entry.genre] || 0) + 1;
      seenAlbums.add(entry.id);
    }
  });

  return Object.entries(counts)
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));
};


export const getLastWeekStats = (albumHistory: any[]) => {
  const noteData = getCookie("notes_history");
  const noteHistory = noteData ? JSON.parse(noteData) : [];

  const now = new Date();
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const result = days.map(day => ({
    weekday: day,
    albums: 0,
    hours: 0,
    notes: 0,
  }));

  albumHistory.forEach((entry: any) => {
    const date = new Date(entry.date);
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) {
      const dayIndex = date.getDay();
      result[dayIndex].albums += 1;
      result[dayIndex].hours += 0.75;
    }
  });

  noteHistory.forEach((entry: any) => {
    const date = new Date(entry.date);
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) {
      const dayIndex = date.getDay();
      result[dayIndex].notes += 1;
    }
  });

  return result;
};

