"use client";

import React from "react";
import { SerializedEditorState, EditorState } from "lexical";
import { cn } from "@/lib/utils";
import { Editor } from "../../../components/blocks/editor-x/editor";

interface LexicalEditorProps {
  className?: string;
  placeholder?: string;
  initialValue?: string | any;
  onChange?: (content: { html: string; json: any }) => void;
  showTreeView?: boolean;
}

export function LexicalEditor({
  className,
  placeholder = "Commencez à écrire...",
  initialValue,
  onChange,
  showTreeView = false,
}: LexicalEditorProps) {
  // Handle serialized state changes
  const handleSerializedChange = React.useCallback(
    (serializedState: SerializedEditorState) => {
      if (onChange) {
        onChange({
          html: JSON.stringify(serializedState),
          json: serializedState,
        });
      }
    },
    [onChange]
  );

  return (
    <div className={cn("relative w-full h-full", className)}>
      <Editor
        editorSerializedState={initialValue}
        onSerializedChange={handleSerializedChange}
      />
    </div>
  );
}
