import { google } from "googleapis";

export const createDrive = (isReceipt: boolean = false) => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_RECEIPTS_REFRESH_TOKEN,
  } = process.env;

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

  oauth2.setCredentials({
    refresh_token: isReceipt
      ? GOOGLE_RECEIPTS_REFRESH_TOKEN
      : GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2 });
};
