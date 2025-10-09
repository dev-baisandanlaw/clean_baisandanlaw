import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { UserResource } from "@clerk/types";
import { Models } from "appwrite";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";
import { COLLECTIONS } from "@/constants/constants";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

export const approveNotaryRequest = async (
  notaryRequest: NotaryRequest,
  res: Models.File,
  user: UserResource
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const finishedDocument = {
    id: res.$id,
    name: res.name,
    mimeType: res.mimeType,
    originalSize: res.sizeOriginal,
    sizeInMb: res.sizeOriginal / 1024 / 1024,
    uploadedAt: res.$createdAt,
    uploadedBy: { fullname: uploaderName, id: user.id },
  };

  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
    {
      status: NotaryRequestStatus.FOR_CLIENT_REVIEW,
      finishedDocument,
      finishedAt: now,
      updatedAt: now,
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
    },
    { merge: true }
  );
};
