import { COLLECTIONS } from "@/constants/constants";
import { db } from "@/firebase/config";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { User } from "@/types/user";
import { UserResource } from "@clerk/types";
import { Client, ID, Models, Storage } from "appwrite";
import dayjs from "dayjs";
import { nanoid, customAlphabet } from "nanoid";
import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { sendEmail } from "@/emails/triggers/sendEmail";

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

export const appwriteCreateNotaryRequest = async (
  file: File | null,
  user: UserResource,
  description: string
) => {
  const uuid = ID.unique();
  const uploaderName = `${user.firstName} ${user.lastName}`;

  const handleUploadFile = async (file: File) => {
    const res = await storage.createFile(BUCKET_ID, uuid, file);

    return res;
  };

  const firebaseFn = async (id: string, res: Models.File | null) => {
    const document =
      res && res?.$id
        ? {
            id: res.$id,
            name: res.name,
            mimeType: res.mimeType,
            originalSize: res.sizeOriginal,
            sizeInMb: res.sizeOriginal / 1024 / 1024,
            uploadedAt: res.$createdAt,
            uploadedBy: { fullname: uploaderName, id: user.id },
          }
        : null;

    await setDoc(doc(db, COLLECTIONS.NOTARY_REQUESTS, id), {
      createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      description,
      document,
      status: NotaryRequestStatus.SUBMITTED,
      timeline: [
        {
          id: customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)(),
          title: "SUBMITTED",
          description,
          dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          status: NotaryRequestStatus.SUBMITTED,
          user: {
            id: user.id,
            fullname: uploaderName,
            email: user.emailAddresses[0].emailAddress,
          },
        },
      ],
      requestor: {
        id: user.id,
        fullname: uploaderName,
        email: user.emailAddresses[0].emailAddress,
      },
      finishedDocument: null,
      finishedAt: null,
      isPaid: false,
    });
  };

  if (file) {
    const resFile = await handleUploadFile(file);
    await firebaseFn(resFile?.$id, resFile);
    await sendEmail({
      to: "",
      subject: "New Notary Request",
      template: "notarization-new-request",
      data: {
        fullname: uploaderName,
        email: user.emailAddresses[0].emailAddress,
        description,
        link: `https://localhost:3001/notary-requests?id=${uuid}`,
      },
      attachments: [
        {
          filename: file.name,
          path: `https://fra.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${uuid}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}&mode=admin`,
        },
      ],
    });
  } else {
    await firebaseFn(uuid, null);
    await sendEmail({
      to: "",
      subject: "New Notary Request",
      template: "notarization-new-request",
      data: {
        fullname: uploaderName,
        email: user.emailAddresses[0].emailAddress,
        description,
        link: `https://localhost:3001/notary-requests/${uuid}`,
      },
    });
  }
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

// export const appwriteHandleUpdateNotaryRequest = async (
//   notaryRequest: NotaryRequest,
//   user: UserResource
// ) => {
//   const uploaderName = `${user.firstName} ${user.lastName}`;
// };

export const appwriteHandleApproveNotaryRequest = async (
  notaryRequest: NotaryRequest,
  file: File,
  user: UserResource
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

  if (notaryRequest?.finishedDocument?.id) {
    await storage.deleteFile(BUCKET_ID, notaryRequest.finishedDocument.id);
  }

  const res = await storage.createFile(BUCKET_ID, ID.unique(), file);
  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
    {
      status: NotaryRequestStatus.FOR_CLIENT_REVIEW,
      finishedDocument: {
        id: res.$id,
        name: res.name,
        mimeType: res.mimeType,
        originalSize: res.sizeOriginal,
        sizeInMb: res.sizeOriginal / 1024 / 1024,
        uploadedAt: res.$createdAt,
        uploadedBy: { fullname: uploaderName, id: user.id },
      },
      timeline: [
        ...(notaryRequest.timeline || []),
        {
          id: nanoid(8),
          title: "FOR CLIENT REVIEW",
          description: "Notary request notarized and is now for client review.",
          dateAndTime: now,
          status: NotaryRequestStatus.FOR_CLIENT_REVIEW,
          user: {
            id: user.id,
            fullname: uploaderName,
            email: user.emailAddresses[0].emailAddress,
          },
        },
      ],
      finishedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
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

export const appwriteDeleteNotaryRequest = async (fileId: string) => {
  // Prepare firebase doc ref
  const caseRef = doc(db, COLLECTIONS.NOTARY_REQUESTS, fileId);
  const caseSnap = await getDoc(caseRef);

  if (!caseSnap.exists()) throw new Error("Firebase cannot find the document");

  const [fileRes, firebaseRes] = await Promise.allSettled([
    storage.deleteFile(BUCKET_ID, fileId),
    deleteDoc(caseRef),
  ]);

  if (fileRes.status === "rejected")
    throw new Error("Failed to delete file from Appwrite");

  if (firebaseRes.status === "rejected")
    throw new Error("Failed to delete Firestore document");
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
