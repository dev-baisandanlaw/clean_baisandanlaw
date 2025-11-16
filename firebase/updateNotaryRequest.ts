import { COLLECTIONS } from "@/constants/constants";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";
import dayjs from "dayjs";
import { NotaryRequest, NotaryRequestStatus } from "@/types/notary-requests";
import { UserResource } from "@clerk/types";
import { customAlphabet } from "nanoid";

export const updateNotaryRequest = async (
  description: string,
  user: UserResource,
  notaryRequest: NotaryRequest,
  newFile?: {
    id: string;
    name: string;
  }
) => {
  const uploaderName = `${user.firstName} ${user.lastName}`;

  const documents = {
    finishedFile: notaryRequest.documents.finishedFile,
    ...(newFile
      ? {
          initialFile: {
            id: newFile.id,
            name: newFile.name,
            uploadedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            uploadedBy: { fullname: uploaderName, id: user.id },
          },
        }
      : {
          initialFile: null,
        }),
  };

  await setDoc(
    doc(db, COLLECTIONS.NOTARY_REQUESTS, notaryRequest.id),
    {
      //   createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      description,
      documents,
      status: NotaryRequestStatus.SUBMITTED,
      timeline: [
        ...(notaryRequest.timeline || []),
        {
          id: customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8)(),
          title: "UPDATED",
          description,
          dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
          status: NotaryRequestStatus.SUBMITTED,
          user: {
            id: user?.id,
            fullname: uploaderName,
          },
        },
      ],
      requestor: {
        id: user?.id,
        fullname: uploaderName,
        email: user?.emailAddresses[0].emailAddress,
      },
    },
    { merge: true }
  );
};
