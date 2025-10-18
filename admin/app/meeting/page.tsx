"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Video, User, Minimize, Maximize } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { JaaSMeeting } from "@jitsi/react-sdk";

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

function ClientMeetingPageContent() {
  const searchParams = useSearchParams();
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [jitsiConfig, setJitsiConfig] = useState<JitsiTokenResponse | null>(
    null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all required info from URL params
  const jwtToken = searchParams.get("jwt");
  const roomName = searchParams.get("room");
  const userName = searchParams.get("user");
  const userEmail = searchParams.get("email");
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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
      if (!jwtToken || !userName || !meetingIdentifier) {
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
        return;
      }

      console.log(
        "Meeting type:",
        isScheduledAppointment ? "Scheduled appointment" : "Instant meeting"
      );
      console.log("Meeting identifier:", meetingIdentifier);
      console.log(
        "Attendance tracking ID:",
        attendanceTrackingId || "None (instant meeting)"
      );

      // Mark client attendance when they access the meeting URL
      // ONLY for scheduled appointments that have an attendanceTrackingId
      if (isScheduledAppointment && attendanceTrackingId) {
        try {
          const response = await fetch("/api/meeting/client-attended", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appointmentId: attendanceTrackingId,
              jwt: jwtToken,
            }),
          });

          if (response.ok) {
            console.log(
              "✅ Client attendance marked successfully for appointment:",
              await response.json()
            );
          } else {
            const errorData = await response.json();
            console.warn(
              "⚠️ Failed to mark client attendance:",
              errorData.error
            );
          }
        } catch (error) {
          console.error("Error marking client attendance:", error);
        }
      } else if (isInstantMeeting) {
        console.log("ℹ️ Instant meeting - no attendance tracking required");
      }

      // Set up meeting configuration
      setJitsiConfig({
        token: jwtToken,
        roomName: roomName || `room-${meetingIdentifier}`,
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
        description: "Consultation avec Dr. Malika Lkhabir",
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

  const handleJoinMeeting = () => {
    setHasJoined(true);
  };

  const handleLeaveMeeting = () => {
    setHasJoined(false);
  };

  // Show Jitsi meeting if user has joined and we have the config
  if (hasJoined && jitsiConfig && meetingInfo) {
    return (
      <>
        <div className={`relative w-screen h-dvh`}>
          <div className={`absolute top-4 left-4 z-50 hidden md:block`}>
            <Button
              variant="outline"
              onClick={toggleFullscreen}
              className="gap-2 bg-background/90 backdrop-blur-sm hover:bg-background/95"
              size="sm"
              title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>

          <JaaSMeeting
            appId={process.env.NEXT_PUBLIC_JITSI_APP_ID || ""}
            roomName={jitsiConfig.roomName}
            jwt={jitsiConfig.token}
            onReadyToClose={handleLeaveMeeting}
            getIFrameRef={(iframeRef: HTMLDivElement) => {
              if (iframeRef) {
                iframeRef.style.height = "100%";
                iframeRef.style.width = "100%";
              }
            }}
          />
        </div>
      </>
    );
  }

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

  // Show error if something is wrong
  if (error || !jitsiConfig || !meetingInfo) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Video className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Réunion non disponible
            </h2>
            <p className="text-muted-foreground mb-4">
              {error ||
                "Cette salle de réunion n'existe pas ou n'est plus accessible."}
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez vérifier le lien fourni ou contacter votre médecin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Dr. Malika Lkhabir</h3>
              <p className="text-muted-foreground">Psychologue clinicienne</p>
            </div>

            {/* Show meeting details only for scheduled appointments */}
            {isScheduledAppointment && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Patient</p>
                    <p className="text-sm text-muted-foreground">
                      {meetingInfo.userName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Consultation programmée</p>
                    <p className="text-sm text-muted-foreground">
                      {meetingInfo.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show instant meeting indicator */}
            {isInstantMeeting && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Video className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">
                      Réunion instantanée
                    </p>
                    <p className="text-sm text-amber-700">
                      Session de consultation immédiate
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Avant de rejoindre :
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Assurez-vous d&apos;être dans un endroit calme</li>
                <li>• Vérifiez votre connexion internet</li>
                <li>• Testez votre caméra et microphone</li>
              </ul>
            </div>

            <Button
              onClick={handleJoinMeeting}
              className="w-full gap-2 py-6 text-lg"
              size="lg"
            >
              <Video className="h-5 w-5" />
              Rejoindre la consultation
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                En rejoignant cette consultation, vous acceptez que la session
                soit enregistrée à des fins thérapeutiques.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default function MeetingPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ClientMeetingPageContent />
    </Suspense>
  );
}
