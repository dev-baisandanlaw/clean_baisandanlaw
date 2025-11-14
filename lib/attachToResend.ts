import axios from "axios";

/**
 * Fetch a Drive file and prepare it for Resend email attachment.
 */
export async function attachToResend(
  fileId: string
): Promise<{ filename: string; content: string }> {
  const url = `/api/google/drive/download/${fileId}`;

  const res = await axios.get(url, { responseType: "arraybuffer" });

  if (res.status !== 200) {
    throw new Error(`Download route failed: ${res.status}`);
  }

  const cd = res.headers["content-disposition"];
  const match = cd?.match(/filename="([^"]+)"/i);
  const filename = match?.[1] ?? "file";

  // Convert ArrayBuffer → Buffer → base64 string
  const buf = Buffer.from(res.data);
  const content = buf.toString("base64");

  return { filename, content };
}
