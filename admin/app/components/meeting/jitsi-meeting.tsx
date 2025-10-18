"use client";

import { useEffect, useRef, useState } from "react";
import { JaaSMeeting } from "@jitsi/react-sdk";
import { Button } from "@/app/components/ui/button";
import {
  ArrowLeft,
  Video,
  Maximize,
  Minimize,
  FileText,
  X,
} from "lucide-react";
import NoteEditor from "@/app/components/notes/note-editor";

interface JitsiMeetingComponentProps {
  roomName: string;
  userName: string;
  userEmail?: string;
  jwt?: string;
  isHost?: boolean;
  onLeaveMeeting: () => void;
  appointmentTitle?: string;
  appointmentId?: string;
  showNotes?: boolean;
}

export default function JitsiMeetingComponent({
  roomName,
  userName,
  jwt,
  isHost = false,
  onLeaveMeeting,
  appointmentTitle = "Consultation",
  appointmentId,
  showNotes = false,
}: JitsiMeetingComponentProps) {
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN;

  console.log("JitsiMeetingComponent props:", {
    roomName,
    userName,
    domain,
    hasJWT: !!jwt,
    jwtLength: jwt?.length || 0,
    isHost,
  });

  useEffect(() => {
    if (!domain) {
      setError("Jitsi domain not configured");
      setIsLoading(false);
      return;
    }

    if (!jwt) {
      setError("Token d'authentification manquant");
      setIsLoading(false);
      return;
    }

    // Set document cookie policy for cross-site compatibility
    if (typeof document !== "undefined") {
      // Allow third-party cookies for Jitsi
      document.cookie = "SameSite=None; Secure";
    }

    // Add a timeout for Jitsi initialization
    const timer = setTimeout(() => {
      if (isLoading && !isJoined) {
        console.log("Jitsi loading timeout - API ready not called");
        setLoadingTimeout(true);
        setError(
          "Délai d'attente dépassé - Impossible de se connecter à la réunion"
        );
        setIsLoading(false);
      }
    }, 20000); // 20 seconds timeout

    return () => clearTimeout(timer);
  }, [domain, jwt, isLoading, isJoined]);

  // Fullscreen functionality
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

  const handleApiReady = (externalApi: any) => {
    console.log("Jitsi API ready called");
    apiRef.current = externalApi;

    // Set loading to false immediately when API is ready
    setIsLoading(false);
    setLoadingTimeout(false);
    setError(null);

    // Add event listeners
    externalApi.addEventListeners({
      readyToClose: () => {
        console.log("Ready to close event");
        onLeaveMeeting();
      },
      participantJoined: (participant: any) => {
        console.log("Participant joined:", participant);
      },
      participantLeft: (participant: any) => {
        console.log("Participant left:", participant);
      },
      videoConferenceJoined: () => {
        console.log("Video conference joined successfully");
        setIsJoined(true);
        setError(null);
      },
      videoConferenceLeft: () => {
        console.log("Video conference left");
        setIsJoined(false);
        onLeaveMeeting();
      },
      authenticationFailed: (error: any) => {
        console.error("Jitsi authentication failed:", error);
        setError("Erreur d'authentification - Token invalide ou expiré");
        setIsLoading(false);
      },
      connectionFailed: (error: any) => {
        console.error("Jitsi connection failed:", error);
        setError("Impossible de se connecter à la réunion");
        setIsLoading(false);
      },
      conferenceFailed: (error: any) => {
        console.error("Jitsi conference failed:", error);
        setError("Erreur lors de la création/jointure de la conférence");
        setIsLoading(false);
      },
    });
  };

  if (error) {
    return (
      <div className="h-screen bg-background w-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Video className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Erreur de connexion
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={onLeaveMeeting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
            <p className="text-xs text-muted-foreground">
              Vérifiez votre connexion internet et réessayez
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background w-full relative flex">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-4">
          <div className="container mx-auto flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onLeaveMeeting}
              className="gap-2"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Quitter
            </Button>
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold truncate">
              {appointmentTitle}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              {isHost && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Hôte
                </div>
              )}
              {showNotes && (
                <Button
                  variant="outline"
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="gap-2"
                  size="sm"
                  title={isNotesOpen ? "Fermer les notes" : "Ouvrir les notes"}
                >
                  <FileText className="h-4 w-4" />
                  Notes
                </Button>
              )}
              <Button
                variant="outline"
                onClick={toggleFullscreen}
                className="gap-2"
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
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-background/95 flex items-center justify-center">
          <div className="text-center">
            <Video className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold mb-2">
              Initialisation de la réunion...
            </h2>
            <p className="text-muted-foreground">Connexion à Jitsi Meet</p>
            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <div>Salle: {roomName}</div>
              <div>Domaine: {domain}</div>
              <div>Utilisateur: {userName}</div>
              <div className="text-xs">
                Token: {jwt ? "✓ Présent" : "❌ Manquant"}
              </div>
            </div>
            {loadingTimeout && (
              <div className="mt-4 space-y-2">
                <p className="text-red-600 text-sm">
                  Délai d&apos;attente dépassé
                </p>
                <Button onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            )}
            <div className="mt-6 text-xs text-yellow-600">
              Si cette page reste affichée, il pourrait y avoir un problème de
              cookies ou de réseau.
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 h-full">
        {/* Jitsi Meeting */}
        <div
          className={`${isFullscreen ? "h-full" : "pt-16 h-full"} relative transition-all duration-300 w-full flex-1`}
        >
          <div
            className={`${
              isFullscreen
                ? "absolute top-4 left-4 z-50"
                : "absolute top-22 left-4 z-50"
            }`}
          >
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
          <div
            className={`${
              isFullscreen
                ? "h-full"
                : "my-2 mx-1 rounded-lg h-[calc(100%-16px)]"
            }  overflow-hidden`}
          >
            <JaaSMeeting
              appId={process.env.NEXT_PUBLIC_JITSI_APP_ID || ""}
              roomName={roomName}
              jwt={jwt}
              onApiReady={handleApiReady}
              onReadyToClose={onLeaveMeeting}
              getIFrameRef={(iframeRef) => {
                if (iframeRef) {
                  iframeRef.style.height = "100%";
                  iframeRef.style.width = "100%";

                  // Add SameSite None cookie configuration for cross-site compatibility
                  iframeRef.setAttribute(
                    "sandbox",
                    "allow-same-origin allow-scripts allow-popups allow-forms allow-storage-access-by-user-activation allow-top-navigation"
                  );
                  iframeRef.setAttribute(
                    "allow",
                    "microphone; camera; speaker-selection; display-capture"
                  );
                  iframeRef.setAttribute("credentialless", "true");
                }
              }}
            />
          </div>
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div
            className={`${
              isNotesOpen ? "w-96" : "w-0"
            } ${isFullscreen ? "hidden" : ""} border-l bg-background h-full transition-all duration-300 flex flex-col overflow-hidden`}
          >
            <div className="p-4 border-b flex items-center justify-between min-w-96">
              <h3 className="font-semibold">Notes de consultation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotesOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-hidden min-w-96">
              <NoteEditor appointmentId={appointmentId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
