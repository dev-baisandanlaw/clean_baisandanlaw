import { google } from "googleapis";

export const createDrive = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } =
    process.env;

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

  oauth2.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  return google.drive({ version: "v3", auth: oauth2 });
};
