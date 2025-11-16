import { Client, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

const databases = new Databases(client);

export const listDatabaseDocuments = async (
  collectionId: string,
  queries?: string[]
) => {
  const result = await databases.listDocuments(
    DATABASE_ID,
    collectionId,
    queries ?? []
  );

  return result;
};

export { databases, DATABASE_ID };
