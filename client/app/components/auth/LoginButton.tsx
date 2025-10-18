"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "../ui/button";
import { Lock } from "lucide-react";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return null; // Don't show anything when logged in
  }

  return (
    <Button
      onClick={() => signIn("google")}
      className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
    >
      <Lock className="w-4 h-4 mr-2" />
      Se connecter
    </Button>
  );
}
