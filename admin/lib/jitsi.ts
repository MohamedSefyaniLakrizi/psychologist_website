import jwt from "jsonwebtoken";

export interface JitsiMeetingConfig {
  roomName: string;
  userName: string;
  userEmail?: string;
  isHost?: boolean;
  appointmentId: string;
  startTime?: Date;
  endTime?: Date;
  meetingName?: string;
}

export function generateJitsiToken(config: JitsiMeetingConfig): string {
  const {
    roomName,
    userName,
    userEmail,
    isHost = false,
    appointmentId,
    startTime,
    endTime,
    meetingName,
  } = config;

  const appId = process.env.JITSI_APP_ID;
  const apiKeyId = process.env.JITSI_API_KEY_ID;
  const privateKey = process.env.JITSI_PRIVATE_KEY;

  console.log("Jitsi Config Check:", {
    appId: appId ? `${appId.substring(0, 10)}...` : "MISSING",
    apiKeyId: apiKeyId ? `${apiKeyId.substring(0, 10)}...` : "MISSING",
    privateKeyExists: !!privateKey,
    privateKeyLength: privateKey?.length || 0,
  });

  if (!appId || !apiKeyId || !privateKey) {
    throw new Error(
      "Jitsi configuration missing - need JITSI_APP_ID, JITSI_API_KEY_ID, and JITSI_PRIVATE_KEY"
    );
  }

  // Clean up the private key (remove headers and format properly)
  const cleanPrivateKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----")
    .trim();

  console.log("---------------------------------------------------------");
  console.log(config);

  const now = Math.floor(Date.now() / 1000);

  // Calculate JWT expiration time
  let jwtExpiration: number;
  if (endTime) {
    // If end time is provided, add 1 day to it
    jwtExpiration = Math.floor(endTime.getTime() / 1000) + 60 * 60 * 24; // +1 day
  } else {
    // Default: 1 day from now
    jwtExpiration = now + 24 * 60 * 60; // 1 day
  }

  // Use provided meeting name or fallback to appointment ID
  const finalMeetingName = meetingName || `Réunion ${appointmentId}`;

  const payload = {
    iss: "chat",
    aud: "jitsi",
    iat: now,
    exp: jwtExpiration,
    nbf: startTime
      ? Math.floor(startTime.getTime() / 1000) - 60 * 60
      : now - 60, // Valid from 1 hour ago to handle clock skew
    sub: appId,
    room: "*",
    context: {
      user: {
        id: userEmail || `user-${appointmentId}-${Date.now()}`,
        name: userName,
        email: userEmail || "",
        avatar: "",
        moderator: isHost,
      },
      features: {
        recording: isHost,
        livestreaming: isHost,
        transcription: isHost,
        "outbound-call": isHost,
        "sip-outbound-call": false,
        "sip-inbound-call": false,
      },
      room: {
        regex: false,
        name: finalMeetingName,
      },
    },
  };

  console.log("JWT Payload:", {
    sub: appId,
    room: payload.room,
    roomName: roomName,
    meetingName: finalMeetingName,
    exp: new Date(jwtExpiration * 1000).toISOString(),
    user: payload.context.user,
    features: payload.context.features,
  });

  const token = jwt.sign(payload, cleanPrivateKey, {
    algorithm: "RS256",
    header: {
      kid: apiKeyId, // CRITICAL: This must be your API Key ID, not App ID
      typ: "JWT",
      alg: "RS256",
    },
  });

  console.log("Generated token length:", token.length);
  return token;
}

export function generateMeetingUrl(
  appointmentId: string,
  clientName: string,
  clientEmail?: string
): string {
  const baseUrl = process.env.WEBSITE_URL;

  // Encode the parameters for the URL
  const params = new URLSearchParams({
    id: appointmentId,
    name: clientName,
    ...(clientEmail && { email: clientEmail }),
  });

  return `${baseUrl}/meeting/${appointmentId}?${params.toString()}`;
}

export function generateRoomName(appointmentId: string): string {
  // Ensure room name follows Jitsi naming conventions
  return appointmentId.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
}

export function generateMeetingName(
  clientName?: string,
  startTime?: Date
): string {
  if (clientName && startTime) {
    // Format: "Client Name - DD/MM/YYYY HH:MM"
    const date = startTime.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = startTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${clientName} - ${date} ${time}`;
  } else if (clientName) {
    // Just client name with current date/time
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = currentDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${clientName} - ${date} ${time}`;
  } else if (startTime) {
    // Just date/time with default name
    const date = startTime.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = startTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Rendez-vous - ${date} ${time}`;
  } else {
    // Fallback: "Rendez-vous - DD/MM/YYYY HH:MM"
    const currentDate = new Date();
    const date = currentDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = currentDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Rendez-vous - ${date} ${time}`;
  }
}

export function generateMeetingUrlWithToken(
  appointmentId: string,
  userType: "host" | "client",
  jwt: string
): string {
  const baseUrl = process.env.WEBSITE_URL;

  const params = new URLSearchParams({
    id: appointmentId,
    userType,
    jwt,
  });

  return `${baseUrl}/meeting/${appointmentId}?${params.toString()}`;
}

export async function generateJitsiTokensForAppointment(
  appointmentId: string,
  clientName: string,
  clientEmail?: string,
  startTime?: Date,
  endTime?: Date
): Promise<{ hostJwt: string; clientJwt: string }> {
  const roomName = generateRoomName(appointmentId);
  const meetingName = generateMeetingName(clientName, startTime);

  // Generate host token (with moderator privileges)
  const hostJwt = generateJitsiToken({
    roomName,
    userName: "Malika Lkhabir",
    userEmail: process.env.HOST_EMAIL || "", // Host email from env
    isHost: true,
    appointmentId,
    startTime,
    endTime,
    meetingName,
  });

  // Generate client token (without moderator privileges)
  const clientJwt = generateJitsiToken({
    roomName,
    userName: clientName,
    userEmail: clientEmail,
    isHost: false,
    appointmentId,
    startTime,
    endTime,
    meetingName,
  });

  return {
    hostJwt,
    clientJwt,
  };
}
