"use client";

import React from "react";
import "./lexical-editor.css";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot } from "lexical";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";

import { cn } from "@/lib/utils";
import { ToolbarPlugin } from "./plugins/toolbar-plugin";

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
    h4: "editor-heading-h4",
    h5: "editor-heading-h5",
    h6: "editor-heading-h6",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
  },
  image: "editor-image",
  link: "editor-link",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    overflowed: "editor-text-overflowed",
    hashtag: "editor-text-hashtag",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
  },
};

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

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
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "LexicalEditor",
    theme,
    onError,
    locale: "fr",
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <div className={cn("relative", className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="bg-background h-full border border-border rounded-lg overflow-hidden ">
          <ToolbarPlugin />
          <div className="relative w-full">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="min-h-[400px] w-full resize-none text-sm p-4 outline-none"
                  ariaLabel="Editor de texte"
                />
              }
              placeholder={
                <div className="absolute top-4 w-full left-4 text-muted-foreground text-sm pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <ListPlugin />
            <LinkPlugin />
            <TabIndentationPlugin />
            <TablePlugin />
            {onChange && <OnChangePlugin onChange={onChange} />}
            {initialValue && (
              <InitializationPlugin initialValue={initialValue} />
            )}
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

// Plugin to handle changes
function OnChangePlugin({
  onChange,
}: {
  onChange: (content: { html: string; json: any }) => void;
}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null);
        const jsonState = editorState.toJSON();
        onChange({ html: htmlString, json: jsonState });
      });
    });
  }, [editor, onChange]);

  return null;
}

// Plugin to initialize editor with content
function InitializationPlugin({
  initialValue,
}: {
  initialValue: string | any;
}) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = React.useState(true);

  React.useEffect(() => {
    if (isFirstRender && initialValue) {
      try {
        let parsedContent;

        // Check if initialValue is already an object or a JSON string
        if (typeof initialValue === "string") {
          parsedContent = JSON.parse(initialValue);
        } else {
          parsedContent = initialValue;
        }

        editor.update(() => {
          const root = $getRoot();
          root.clear();

          // If we have a valid Lexical editor state, restore it
          if (
            parsedContent &&
            typeof parsedContent === "object" &&
            parsedContent.root
          ) {
            const editorState = editor.parseEditorState(parsedContent);
            editor.setEditorState(editorState);
          }
        });
      } catch (error) {
        console.error("Error initializing editor content:", error);
        // Initialize with empty content if parsing fails
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
      setIsFirstRender(false);
    }
  }, [editor, initialValue, isFirstRender]);

  return null;
}
