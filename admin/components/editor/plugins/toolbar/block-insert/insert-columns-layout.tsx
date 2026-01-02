"use client";

import { Columns3Icon } from "lucide-react";

import { useToolbarContext } from "@/components/editor/context/toolbar-context";
import { InsertLayoutDialog } from "@/components/editor/plugins/layout-plugin";
import { SelectItem } from "@/app/components/ui/select";

export function InsertColumnsLayout() {
  const { activeEditor, showModal } = useToolbarContext();

  return (
    <SelectItem
      value="columns"
      onPointerUp={() =>
        showModal("Insérer une mise en page en colonnes", (onClose) => (
          <InsertLayoutDialog activeEditor={activeEditor} onClose={onClose} />
        ))
      }
      className=""
    >
      <div className="flex items-center gap-1">
        <Columns3Icon className="size-4" />
        <span>Mise en page en colonnes</span>
      </div>
    </SelectItem>
  );
}
