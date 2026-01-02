"use client";

import { useState } from "react";
import { $isTableSelection } from "@lexical/table";
import { $isRangeSelection, BaseSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { SubscriptIcon, SuperscriptIcon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar";
import { ToggleGroup, ToggleGroupItem } from "@/app/components/ui/toggle-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/app/components/ui/tooltip";

export function SubSuperToolbarPlugin() {
  const { activeEditor } = useToolbarContext();
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
    }
  };

  useUpdateToolbarHandler($updateToolbar);

  return (
    <ToggleGroup
      type="single"
      defaultValue={
        isSubscript ? "subscript" : isSuperscript ? "superscript" : ""
      }
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="subscript"
            size="sm"
            aria-label="Basculer l'indice"
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
            }}
            variant={"outline"}
          >
            <SubscriptIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Indice</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="superscript"
            size="sm"
            aria-label="Basculer l'exposant"
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
            }}
            variant={"outline"}
          >
            <SuperscriptIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Exposant</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
}
