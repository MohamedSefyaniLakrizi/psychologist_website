import { Calendar } from "../components/calendar/calendar";

// Disable caching entirely - always fetch fresh data
export const revalidate = 0;
// Force dynamic rendering - never use static generation
export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return (
    <div className="h-full -mx-4 flex justify-center items-center">
      <Calendar />
    </div>
  );
}
