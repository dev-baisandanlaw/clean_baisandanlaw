import axios from "axios";

export const sendEmail = async (emailBody: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, string>;
  attachments?: {
    filename: string;
    path: string;
  }[];
}) => {
  await axios.post("/api/resend/send", {
    ...emailBody,
  });
};
