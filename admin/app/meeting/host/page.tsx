"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Video } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import JitsiMeetingComponent from "@/app/components/meeting/jitsi-meeting";
import { useSession } from "next-auth/react";

interface JitsiTokenResponse {
  token: string;
  roomName: string;
  domain: string;
}

interface MeetingInfo {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  userName: string;
  userEmail?: string;
}

function HostMeetingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jitsiConfig, setJitsiConfig] = useState<JitsiTokenResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Get all required info from URL params
  const jwtToken = searchParams.get("jwt");
  const roomName = searchParams.get("room");
  const userName =
    searchParams.get("user") || session?.user?.name || "Psychologue";
  const userEmail = searchParams.get("email") || session?.user?.email;
  const domain = searchParams.get("domain") || "8x8.vc";

  // Distinct parameters for different meeting types
  const appointmentId = searchParams.get("appointmentId"); // For scheduled appointments (database tracking)
  const id = searchParams.get("id"); // For instant meetings (no database tracking)
  const meetingTitle = searchParams.get("title");

  // Determine meeting type and tracking
  const isScheduledAppointment = !!appointmentId;
  const isInstantMeeting = !!id;
  const meetingIdentifier = appointmentId || id; // The actual identifier to use
  const attendanceTrackingId = appointmentId; // Only for scheduled appointments

  // Check if JWT is valid (not expired)
  const validateJWT = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error("Error validating JWT:", error);
      return false;
    }
  };

  useEffect(() => {
    const validateMeeting = async () => {
      setIsLoading(true);

      // Check if all required parameters are present
      if (!jwtToken || !roomName || !meetingIdentifier) {
        setError(
          "Paramètres de réunion manquants. Veuillez vérifier le lien fourni."
        );
        setIsLoading(false);
        return;
      }

      // Validate JWT first - if invalid, don't proceed
      if (!validateJWT(jwtToken)) {
        setError("La réunion a expiré ou n'est plus valide");
        setIsLoading(false);
        // Don't set jitsiConfig or meetingInfo if JWT is invalid
        return;
      }

      console.log(
        "Host - Meeting type:",
        isScheduledAppointment ? "Scheduled appointment" : "Instant meeting"
      );
      console.log("Host - Meeting identifier:", meetingIdentifier);
      console.log(
        "Host - Attendance tracking ID:",
        attendanceTrackingId || "None (instant meeting)"
      );

      // Mark host attendance when they access the meeting URL
      // ONLY for scheduled appointments that have an attendanceTrackingId
      if (isScheduledAppointment && attendanceTrackingId) {
        try {
          const response = await fetch("/api/meeting/host-attended", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appointmentId: attendanceTrackingId, // Use the specific tracking ID
              jwt: jwtToken,
            }),
          });

          if (response.ok) {
            console.log(
              "✅ Host attendance marked successfully for appointment:",
              attendanceTrackingId
            );
          } else {
            const errorData = await response.json();
            console.warn("⚠️ Failed to mark host attendance:", errorData.error);
          }
        } catch (error) {
          console.error("Error marking host attendance:", error);
        }
      } else if (isInstantMeeting) {
        console.log("ℹ️ Instant meeting - no attendance tracking required");
      }

      // Only set up meeting if JWT is valid
      setJitsiConfig({
        token: jwtToken,
        roomName: roomName,
        domain: domain,
      });

      // Create meeting info
      const meeting: MeetingInfo = {
        id: meetingIdentifier,
        title:
          meetingTitle ||
          (isInstantMeeting ? "Réunion instantanée" : "Consultation en ligne"),
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        description: "Consultation",
        userName: userName,
        userEmail: userEmail || undefined,
      };

      setMeetingInfo(meeting);
      setIsLoading(false);
    };

    validateMeeting();
  }, [
    jwtToken,
    roomName,
    userName,
    userEmail,
    domain,
    meetingIdentifier,
    attendanceTrackingId,
    isScheduledAppointment,
    isInstantMeeting,
    meetingTitle,
  ]);

  const handleLeaveMeeting = () => {
    router.push("/meeting-room");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-lg">Chargement de la réunion...</div>
        </div>
      </div>
    );
  }

  // Show error if something is wrong (including invalid JWT)
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Video className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Réunion non disponible
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/meeting-room")}>
              Retour aux réunions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading || !jitsiConfig || !meetingInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <div className="text-lg">Chargement de la réunion...</div>
        </div>
      </div>
    );
  }

  // Only render the meeting component if everything is valid
  return (
    <div className="relative w-full h-screen">
      <JitsiMeetingComponent
        roomName={jitsiConfig.roomName}
        userName={meetingInfo.userName}
        userEmail={meetingInfo.userEmail}
        jwt={jitsiConfig.token}
        isHost={true}
        onLeaveMeeting={handleLeaveMeeting}
        appointmentTitle={meetingInfo.title}
        appointmentId={attendanceTrackingId || undefined}
        showNotes={isScheduledAppointment}
      />
    </div>
  );
}

export default function HostMeetingPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <HostMeetingPageContent />
    </Suspense>
  );
}
