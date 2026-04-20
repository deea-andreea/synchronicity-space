export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isMe?: boolean;
  followingIds: string[]; 
}