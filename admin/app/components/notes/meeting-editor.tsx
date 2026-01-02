"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalEditor } from "../editor/lexical-editor";
import { Card, CardContent } from "../ui/card";
import { createNote, getNote, updateNote } from "@/lib/actions/notes";
import { Input } from "../ui/input";
import { SquarePen } from "lucide-react";
import { debounce } from "lodash";

interface NoteEditorProps {
  noteId?: string;
  appointmentId?: string;
  onClose?: () => void;
  showHeader?: boolean;
  className?: string;
}

export default function MeetingEditor({
  noteId,
  appointmentId,
  onClose,
  showHeader = true,
  className = "",
}: NoteEditorProps) {
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const lastSavedTitleRef = useRef<string>("");

  const [note, setNote] = useState<any>(null);
  useEffect(() => {
    async function fetchNote() {
      if (noteId) {
        setNote(await getNote(noteId));
        setContent(note.content);
        setTitle(note.title);
      } else {
        setNote(null);
        setContent(null);
        setTitle("");
      }
    }
    fetchNote();
  }, [noteId]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingTitle(false);
    console.log("Title submitted:", title);
    autoSave();
  };

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  }, []);

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingTitle(false);
    } else if (e.key === "Escape") {
      setTitle(note?.title || "");
      setIsEditingTitle(false);
    }
  };

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    console.log("Auto-saving note...");
    console.log("Current content:", content);
    console.log("Current title:", title);
    if (!content) return;

    const currentContentString = JSON.stringify(content);
    const titleString = title.trim() || "Sans titre";

    // Check if content or title has actually changed
    if (
      currentContentString === lastSavedContentRef.current &&
      titleString === lastSavedTitleRef.current
    ) {
      return;
    }
    setIsSaving(true);
    try {
      let updatedNote;

      if (note?.id) {
        // Update existing note
        updatedNote = await updateNote(note.id, {
          title: titleString,
          content: content,
        });
      } else {
        // Create new note
        updatedNote = await createNote({
          title: titleString,
          content: content,
          appointmentId: appointmentId,
        });
      }

      setNote(updatedNote);
      lastSavedContentRef.current = currentContentString;
      lastSavedTitleRef.current = titleString;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [note, content, title, appointmentId]);

  const handleContentChange = useCallback(
    debounce((editorContent) => {
      setContent(editorContent.json);
      setHtmlContent(editorContent.html);
      setHasUnsavedChanges(true);
      autoSave();
    }, 500),
    [autoSave]
  );

  return (
    <div className="p-2 h-full">
      {/* Editable title */}
      <div className="mb-4">
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit}>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={handleTitleKeyDown}
              className="text-2xl font-semibold border-none shadow-none p-1 w-auto h-auto"
              autoFocus
            />
          </form>
        ) : (
          <h1
            className="text-2xl flex items-center gap-3 font-semibold cursor-pointer hover:bg-muted/50 p-2 rounded -m-2 group"
            onClick={() => setIsEditingTitle(true)}
          >
            {title || "Sans titre"}
            <SquarePen className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </h1>
        )}
      </div>
      <Card className="flex-1 flex flex-col py-0 w-full h-full">
        <CardContent className="flex-1 p-0 w-full h-full">
          <LexicalEditor
            className="h-full w-full"
            placeholder="Commencez à rédiger..."
            onChange={handleContentChange}
            initialValue={content || undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
