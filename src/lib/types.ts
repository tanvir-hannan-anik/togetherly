export type User = { _id: string; name: string; email: string };

export type CommunityEvent = {
  _id: string;
  title: string;
  type: string;
  thumbnail: string;
  location: string;
  date: string;
  description: string;
  duration: number;
  organizerId: string;
  organizerName: string;
  participantCount: number;
  joined: boolean;
};

export type EventResults = {
  events: CommunityEvent[];
  total: number;
  page: number;
  pages: number;
};

export type CommunityStats = {
  events: number;
  volunteers: number;
  neighborhoods: number;
  completed: number;
  categories: { _id: string; count: number }[];
};
