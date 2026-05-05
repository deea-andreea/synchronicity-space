import type { User } from "../models/User";

export const mockUsers: User[] = [
  {
    id: "92746eae-47aa-11f1-96bb-58961df7cb95",
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