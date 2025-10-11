// import { COLLECTIONS } from "@/constants/constants";
// import { db } from "@/firebase/config";
// import { UserResource } from "@clerk/types";
// import dayjs from "dayjs";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { nanoid } from "nanoid";

// export const updateMatterTimeline = async (
//   matterId: string,
//   user: UserResource,
//   type:
//     | "document_uploaded"
//     | "document_deleted"
//     | "task_created"
//     | "task_completed"
//     | "schedule_created"
//     | "schedule_updated"
//     | "schedule_deleted"
//     | "system_updates"
// ) => {
//   const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
//   const currentUser = {
//     fullname: `${user.firstName} ${user.lastName}`,
//     id: user.id,
//     email: user.emailAddresses[0].emailAddress,
//   };

//   const fetchMatterTimeline = await getDoc(
//     doc(db, COLLECTIONS.CASES, matterId)
//   );

//   const currentMatterTimeline = fetchMatterTimeline?.data() || {};

//   await setDoc(doc(db, COLLECTIONS.MATTER_TIMELINES, matterId), {
//     id: matterId,
//     updatedAt: now,
//     items: [
//       ...(currentMatterTimeline.items || []),
//       {
//         id: nanoid(10),
//         type,
//         dateAndTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
//       },
//     ],
//   });
// };
