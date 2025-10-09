import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { User } from "@/types/user";
import { UserResource } from "@clerk/types";
import { Client, ID, Models, Storage } from "appwrite";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const storage = new Storage(client);

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

type UploadOutcome = {
  successes: Array<{
    id: string;
    name: string;
    mimeType: string;
    originalSize: number;
    sizeInMb: number;
    uploadedAt: string;
    uploadedBy: { fullname: string; id: string };
  }>;
  failures: Array<{ fileName: string; error: unknown }>;
};

// operations
export const appwriteGetFileLink = async (id: string) => {
  return `https://fra.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`;
};

export const appwriteUploadFile = async (file: File, id: string) => {
  const res = await storage.createFile(BUCKET_ID, id, file);
  return res;
};

export const appwriteDeleteFile = async (id: string) => {
  await storage.deleteFile(BUCKET_ID, id);
};

export const appwriteDownloadFile = async (fileId: string) => {
  try {
    const downloadURL = storage.getFileDownload(BUCKET_ID, fileId);
    const res = await fetch(downloadURL);

    if (!res.ok) {
      throw new Error();
    }
    const a = document.createElement("a");
    a.href = downloadURL;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    toast.error("File is either deleted or corrupted");
  }
};

export const appwriteUploadMultipleFiles = async (
  files: File[],
  user: User
): Promise<UploadOutcome> => {
  const uploaderName = `${user.first_name} ${user.last_name}`;

  const CONCURRENCY = 3;
  const queue = [...files];
  const successes: UploadOutcome["successes"] = [];
  const failures: UploadOutcome["failures"] = [];

  const worker = async () => {
    while (queue.length) {
      const f = queue.shift()!;
      try {
        // Pass File directly (no InputFile wrapper needed)
        const res = await storage.createFile(BUCKET_ID, ID.unique(), f);

        successes.push({
          id: res.$id,
          name: res.name,
          mimeType: res.mimeType,
          originalSize: res.sizeOriginal,
          sizeInMb: res.sizeOriginal / 1024 / 1024,
          uploadedAt: res.$createdAt,
          uploadedBy: { fullname: uploaderName, id: user.id },
        });
      } catch (error) {
        failures.push({ fileName: f.name, error });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, worker)
  );

  return { successes, failures };
};

export const appwriteUpdateNotaryRequest = async (
  file: File | null | { uploadedBy: { id: string } },
  user: UserResource,
  description: string,
  notaryRequest: NotaryRequest
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

  // Helper function to create document object
  const createDocumentObject = (
    uploadedFile: Models.File,
    uploaderName: string,
    userId: string
  ) => ({
    id: uploadedFile.$id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    originalSize: uploadedFile.sizeOriginal,
    sizeInMb: uploadedFile.sizeOriginal / 1024 / 1024,
    uploadedAt: uploadedFile.$createdAt,
    uploadedBy: { fullname: uploaderName, id: userId },
  });

  // Helper function to create timeline entry
  const createTimelineEntry = (
    uploaderName: string,
    userId: string,
    userEmail: string
  ) => ({
    id: nanoid(8),
    title: "SUBMITTED",
    description,
    dateAndTime: now,
    status: NotaryRequestStatus.SUBMITTED,
    user: {
      id: userId,
      fullname: uploaderName,
      email: userEmail,
    },
  });

  // Determine the update type
  const isFileUnchanged =
    file && typeof file === "object" && "uploadedBy" in file;
  const isNewFile = file && !isFileUnchanged; // Real File object
  const isRemovingFile = file === null;

  let document = notaryRequest.document;

  // Handle file operations based on scenario
  if (isFileUnchanged) {
    // Scenario 1: File unchanged, just update description
    // document stays the same
  } else if (isNewFile) {
    // Scenario 2 & 3: New file (replace existing or add new)
    if (notaryRequest.document) {
      // Delete existing file if replacing
      await storage.deleteFile(BUCKET_ID, notaryRequest.document.id);
    }
    // Upload new file
    const uploadedFile = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      file as File
    );
    document = createDocumentObject(uploadedFile, uploaderName, user.id);
  } else if (isRemovingFile && notaryRequest.document) {
    // Scenario 4: Remove existing file
    await storage.deleteFile(BUCKET_ID, notaryRequest.document.id);
    document = null;
  }
  // Scenario 5: No file at all - document stays null

  // Single Firebase update for all scenarios
  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
    {
      updatedAt: now,
      document,
      description,
      status: NotaryRequestStatus.SUBMITTED,
      timeline: [
        ...(notaryRequest.timeline || []),
        createTimelineEntry(
          uploaderName,
          user.id,
          user.emailAddresses[0].emailAddress
        ),
      ],
    },
    { merge: true }
  );
};

// listings
export const appwriteGetAllFiles = async () => {
  try {
    const result = await storage.listFiles(BUCKET_ID);
    return result.files;
  } catch {
    throw new Error();
  }
};
