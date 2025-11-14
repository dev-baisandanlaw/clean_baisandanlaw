import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { UserResource } from "@clerk/types";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";
import { COLLECTIONS } from "@/constants/constants";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

export const approveNotaryRequest = async (
  notaryRequest: NotaryRequest,
  user: UserResource,
  newFile: {
    id: string;
    name: string;
  }
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const documents = {
    ...notaryRequest.documents,
    ...(newFile?.id && {
      finishedFile: {
        id: newFile.id,
        name: newFile.name,
        uploadedAt: now,
        uploadedBy: { fullname: uploaderName, id: user.id },
      },
    }),
  };

  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
    {
      status: NotaryRequestStatus.FOR_CLIENT_REVIEW,
      documents,
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
