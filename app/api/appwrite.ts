import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { Client, ID, Storage } from "appwrite";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const storage = new Storage(client);

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

// operations
export const appwriteHandleUploadFile = async (file: File, caseId: string) => {
  try {
    const result = await storage.createFile(BUCKET_ID, ID.unique(), file);
    await updateDoc(doc(db, COLLECTIONS.CASES, caseId), {
      documents: arrayUnion({
        id: result.$id,
        name: result.name,
        mimeType: result.mimeType,
        originalSize: result.sizeOriginal,
        sizeInMb: result.sizeOriginal / 1024 / 1024,
        uploadedAt: result.$createdAt,
      }),
    });
  } catch (err) {
    console.error(err);
  }
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
