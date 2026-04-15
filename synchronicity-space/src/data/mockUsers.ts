import type { User } from "../models/User";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex",
    email: "user1@gmail.com",
    password: "parola123",
    isMe: true,
    followingIds: ["2", "3"]
  },
  {
    id: "2",
    name: "Sarah",
    email: "user2@gmail.com",
    password: "parola123",
    followingIds: ["1"]
  },
  {
    id: "3",
    name: "Marcus",
    email: "user2@gmail.com",
    password: "parola123",
    followingIds: ["1"]
  }
];