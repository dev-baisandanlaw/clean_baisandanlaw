export interface Message {
  messageId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    fullname: string;
    position: string;
  };
}

export interface Thread {
  id: string;
  caseId: string;
  messages: Message[];
}
