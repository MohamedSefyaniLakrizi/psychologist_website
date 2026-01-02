"use client";

import { useCallback, useState } from "react";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from "@lexical/selection";
import { $getSelection, $isRangeSelection, BaseSelection } from "lexical";
import { TypeIcon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { useUpdateToolbarHandler } from "@/components/editor/editor-hooks/use-update-toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/app/components/ui/tooltip";

const FONT_FAMILY_OPTIONS = [
  "Arial",
  "Verdana",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Trebuchet MS",
];

export function FontFamilyToolbarPlugin() {
  const style = "font-family";
  const [fontFamily, setFontFamily] = useState("Arial");

  const { activeEditor } = useToolbarContext();

  const $updateToolbar = (selection: BaseSelection) => {
    if ($isRangeSelection(selection)) {
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "Arial")
      );
    }
  };

  useUpdateToolbarHandler($updateToolbar);

  const handleClick = useCallback(
    (option: string) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [activeEditor, style]
  );

  const buttonAriaLabel = "Options de formatage pour la famille de polices";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Select
          value={fontFamily}
          onValueChange={(value) => {
            setFontFamily(value);
            handleClick(value);
          }}
          aria-label={buttonAriaLabel}
        >
          <SelectTrigger className="!h-8 w-min gap-1">
            <TypeIcon className="size-4" />
            <span style={{ fontFamily }}>{fontFamily}</span>
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILY_OPTIONS.map((option) => (
              <SelectItem
                key={option}
                value={option}
                style={{ fontFamily: option }}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TooltipTrigger>
      <TooltipContent>Police d&apos;écriture</TooltipContent>
    </Tooltip>
  );
}
