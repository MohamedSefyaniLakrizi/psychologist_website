import { CheckIcon, Filter, RefreshCcw, Monitor, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Separator } from "@/app/components/ui/separator";
import { Toggle } from "@/app/components/ui/toggle";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";

export default function FilterEvents() {
  const { selectedFormats, filterEventsBySelectedFormats, clearFilter } =
    useCalendar();

  const formats: {
    value: "ONLINE" | "FACE_TO_FACE";
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "ONLINE",
      label: "En ligne",
      icon: <Monitor className="size-4" />,
    },
    {
      value: "FACE_TO_FACE",
      label: "En personne",
      icon: <Users className="size-4" />,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Toggle variant="outline" className="cursor-pointer w-fit">
          <Filter className="h-4 w-4" />
        </Toggle>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {formats.map((format, index) => (
          <DropdownMenuItem
            key={index}
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              filterEventsBySelectedFormats(format.value);
            }}
          >
            {format.icon}
            <span className="flex justify-center items-center gap-2 flex-1">
              {format.label}
              <span>
                {selectedFormats.includes(format.value) && (
                  <span className="text-blue-500">
                    <CheckIcon className="size-4" />
                  </span>
                )}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <Separator className="my-2" />
        <DropdownMenuItem
          disabled={selectedFormats.length === 0}
          className="flex gap-2 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            clearFilter();
          }}
        >
          <RefreshCcw className="size-3.5" />
          Effacer le filtre
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
