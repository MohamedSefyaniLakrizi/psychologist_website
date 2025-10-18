"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  slideFromLeft,
  slideFromRight,
} from "@/app/components/calendar/animations";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";
import { AddEditAppointmentDialog } from "@/app/components/calendar/dialogs/add-edit-appointment-dialog";
import { DateNavigator } from "@/app/components/calendar/header/date-navigator";
import FilterEvents from "@/app/components/calendar/header/filter";
import { TodayButton } from "@/app/components/calendar/header/today-button";
import { UserSelect } from "@/app/components/calendar/header/user-select";
import Views from "./view-tabs";

export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>

      <motion.div
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
      >
        <div className="options flex-wrap flex items-center gap-4 md:gap-2">
          <FilterEvents />
          <Views />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-1.5">
          <UserSelect />

          <AddEditAppointmentDialog>
            <Button>
              <Plus className="h-4 w-4" />
              Nouveau rendez-vous
            </Button>
          </AddEditAppointmentDialog>
        </div>
      </motion.div>
    </div>
  );
}
