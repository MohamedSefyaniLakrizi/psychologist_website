"use client";

import { PlusIcon } from "lucide-react";

import { useEditorModal } from "@/components/editor/editor-hooks/use-modal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "@/app/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/app/components/ui/tooltip";

export function BlockInsertPlugin({ children }: { children: React.ReactNode }) {
  const [modal] = useEditorModal();

  return (
    <>
      {modal}
      <Tooltip>
        <TooltipTrigger asChild>
          <Select value={""}>
            <SelectTrigger className="!h-8 w-min gap-1">
              <PlusIcon className="size-4" />
              <span>Insérer</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>{children}</SelectGroup>
            </SelectContent>
          </Select>
        </TooltipTrigger>
        <TooltipContent>Insérer un bloc</TooltipContent>
      </Tooltip>
    </>
  );
}
