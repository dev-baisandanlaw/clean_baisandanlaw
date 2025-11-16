import { DATABASE_ID, databases } from "@/app/api/appwrite";

const COLLECTIONS = {
  MATTERS: process.env.NEXT_PUBLIC_APPWRITE_DB_MATTERS_COLLECTION_ID!,
  NOTARY_REQUESTS:
    process.env.NEXT_PUBLIC_APPWRITE_DB_NOTARY_REQUESTS_COLLECTION_ID!,
  RETAINERS: process.env.NEXT_PUBLIC_APPWRITE_DB_RETAINERS_COLLECTION_ID!,
};

export async function syncToAppwrite(
  collection: keyof typeof COLLECTIONS,
  documentId: string,
  data: Record<string, unknown>
) {
  try {
    const collectionId = COLLECTIONS[collection];
    try {
      await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        data
      );
    } catch (error) {
      if ((error as unknown as { code: number }).code === 404) {
        await databases.createDocument(
          DATABASE_ID,
          collectionId,
          documentId,
          data
        );
      } else {
        throw new Error("Failed to sync to Appwrite");
      }
    }
  } catch {
    throw new Error("Failed to sync to Appwrite");
  }
}

export async function deleteFromAppwrite(
  collection: keyof typeof COLLECTIONS,
  documentId: string
) {
  try {
    const collectionId = COLLECTIONS[collection];
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
  } catch {
    throw new Error("Failed to delete from Appwrite");
  }
}
