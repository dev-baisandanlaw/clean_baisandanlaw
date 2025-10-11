"use client";

import { Button } from "@mantine/core";
import axios from "axios";

export default function DashboardPage() {
  const handleClick = async () => {
    const res = axios.get("/api/google/oauth/url").then((res) => {
      console.log(res.data);
    });

    console.log(res);
  };

  const handleCallback = async () => {
    const res = axios
      .get("/api/google/oauth/callback", {
        params: {
          code: "4%2F0AVGzR1CfXgoXkBGp5-8U3pEGfw9EdYyRi1X2tHBAGuXuWmVpdQTJp1Kl2AKSIVggrQhGSw",
        },
      })
      .then((res) => {
        console.log(res.data);
      });
  };

  const handleAddEvent = async () => {
    const res = axios.post("/api/google/calendar/add").then((res) => {
      console.log(res.data);
    });
    console.log(res);
  };

  const handleListFilesInDrive = async () => {
    axios
      .get("/api/google/drive/list", {
        params: {
          folderId: "anglala",
        },
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleListAllFolders = async () => {
    axios
      .get("/api/google/drive/list", {
        params: {
          fields: "files(id, name, parents)",
          search: "__BAISANDANLAW__",
        },
      })
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleCreateFolderInDrive = async () => {
    axios
      .post("/api/google/drive/gFolders/create", {
        name: "anglala2",
        parentId: process.env.NEXT_PUBLIC_GOOGLE_BAISANDANLAW_PARENT_FOLDER_ID,
      })
      .then((res) => {
        console.log(res.data);
      });
  };

  return (
    <>
      <Button onClick={handleClick}>Click me</Button>
      <Button onClick={handleCallback}>Callback</Button>
      <Button onClick={handleAddEvent}>Add Event</Button>
      <Button onClick={handleListFilesInDrive}>List Files in Drive</Button>
      <Button onClick={handleListAllFolders}>List All Folders</Button>
      <Button onClick={handleCreateFolderInDrive}>
        Create Folder in Drive
      </Button>
    </>
  );
}
