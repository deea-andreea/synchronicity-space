const USERS = [
  { id: "1", name: "Alex", email: "user1@gmail.com", followingIds: ["2", "3"] },
  { id: "2", name: "Sarah", email: "user2@gmail.com", followingIds: ["1"] },
  { id: "3", name: "Marcus", email: "user3@gmail.com", followingIds: ["1"] },
  { id: "4", name: "Jordan", email: "user4@gmail.com", followingIds: [] },
];

export function getAllUsers() { return USERS; }
export function getUserById(id) { return USERS.find(u => u.id === id) ?? null; }