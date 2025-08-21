import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { User } from "@/types/user";
import { Client, ID, Storage } from "appwrite";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
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
export const appwriteHandleUploadFile = async (
  files: File[],
  caseId: string,
  user: User
): Promise<UploadOutcome> => {
  const CASE_REF = doc(db, COLLECTIONS.CASES, caseId);
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

  if (successes.length) {
    await updateDoc(CASE_REF, {
      documents: arrayUnion(...successes),
    });
  }

  return { successes, failures };
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

export const appwriteDeleteFile = async (fileId: string, caseId: string) => {
  // Prepare firebase doc ref
  const caseRef = doc(db, COLLECTIONS.CASES, caseId);
  const caseSnap = await getDoc(caseRef);

  if (!caseSnap.exists()) throw new Error("Firebase cannot find the document");

  const currentDocs = caseSnap.data()?.documents || [];
  const updatedDocs = currentDocs.filter(
    (doc: { id: string }) => doc.id !== fileId
  );

  const [fileRes, firebaseRes] = await Promise.allSettled([
    storage.deleteFile(BUCKET_ID, fileId),
    updateDoc(caseRef, { documents: updatedDocs }),
  ]);

  if (fileRes.status === "rejected")
    throw new Error("Failed to delete file from Appwrite");

  if (firebaseRes.status === "rejected")
    throw new Error("Failed to update Firestore document");
};

// listings
export const appwriteGetAllFiles = async () => {
  try {
    const result = await storage.listFiles(BUCKET_ID);
    return result.files;
  } catch (err) {
    console.error(err);
  }
};
