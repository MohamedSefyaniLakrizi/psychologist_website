"use client";

import { useParams, useRouter } from "next/navigation";
import NoteEditor from "@/app/components/notes/note-editor";

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

  return <NoteEditor noteId={noteId} onClose={() => router.push("/notes")} />;
}
