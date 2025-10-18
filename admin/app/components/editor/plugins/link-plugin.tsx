"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $createTextNode } from "lexical";
import { $createLinkNode } from "@lexical/link";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Link } from "lucide-react";

export function LinkPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const insertLink = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (linkUrl) {
          const selectedText = selection.getTextContent();
          const textToUse = linkText || selectedText || linkUrl;

          // Clear current selection and insert new content
          selection.removeText();

          // Create link node with text
          const linkNode = $createLinkNode(linkUrl);
          const textNode = $createTextNode(textToUse);
          linkNode.append(textNode);
          selection.insertNodes([linkNode]);
        }
      }
    });
    setIsLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  return (
    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Insérer un lien">
          <Link className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insérer un lien</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://exemple.com"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="linkText">Texte à afficher</Label>
            <Input
              id="linkText"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Texte du lien (optionnel)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsLinkDialogOpen(false)}
          >
            Annuler
          </Button>
          <Button onClick={insertLink} disabled={!linkUrl}>
            Insérer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
