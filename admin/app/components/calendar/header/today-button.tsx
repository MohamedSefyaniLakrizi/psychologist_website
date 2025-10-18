import { formatDate } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { buttonHover } from "@/app/components/calendar/animations";
import { useCalendar } from "@/app/components/calendar/contexts/calendar-context";

const MotionButton = motion.create(Button);

export function TodayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();
  const handleClick = () => setSelectedDate(today);

  return (
    <MotionButton
      variant="outline"
      className="flex h-14 w-14 flex-col items-center justify-center p-0 text-center"
      onClick={handleClick}
      variants={buttonHover}
      whileHover="hover"
      whileTap="tap"
    >
      <motion.span
        className="w-full bg-primary py-1 text-xs font-semibold text-primary-foreground"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {formatDate(today, "MMM", { locale: fr }).toUpperCase()}
      </motion.span>
      <motion.span
        className="text-lg font-bold"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {today.getDate()}
      </motion.span>
    </MotionButton>
  );
}
