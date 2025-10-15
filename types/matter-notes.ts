export interface Note {
  id: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    profileImageUrl: string;
  };

  createdAt: string;
  updatedAt: string;

  content: string;
}
