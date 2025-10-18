"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import GoogleIcon from "./google-icon";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Redirect to home if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  return (
    <div className={cn("flex flex-col gap-6 w-96 mx-3", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Connexion à votre compte</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {error === "unauthorized" &&
                    "Accès non autorisé. Veuillez utiliser un compte autorisé."}
                  {error === "OAuthSignin" &&
                    "Erreur lors de la connexion avec Google."}
                  {error === "OAuthCallback" && "Erreur de callback OAuth."}
                  {error === "OAuthCreateAccount" &&
                    "Erreur lors de la création du compte."}
                  {error === "EmailCreateAccount" &&
                    "Erreur lors de la création du compte email."}
                  {error === "Callback" && "Erreur de callback."}
                  {error === "OAuthAccountNotLinked" &&
                    "Ce compte n'est pas lié."}
                  {error === "EmailSignin" &&
                    "Erreur lors de l'envoi de l'email."}
                  {error === "CredentialsSignin" && "Identifiants invalides."}
                  {![
                    "unauthorized",
                    "OAuthSignin",
                    "OAuthCallback",
                    "OAuthCreateAccount",
                    "EmailCreateAccount",
                    "Callback",
                    "OAuthAccountNotLinked",
                    "EmailSignin",
                    "CredentialsSignin",
                  ].includes(error) &&
                    "Une erreur est survenue lors de la connexion."}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={status === "loading"}
                  onClick={(e) => {
                    e.preventDefault();
                    signIn("google", { callbackUrl });
                  }}
                >
                  <GoogleIcon />
                  Se connecter avec Google
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Problème de connexion? Contactez{" "}
              <a
                href="mailto:mohamedsefyani@gmail.com"
                className="underline underline-offset-4"
              >
                l&apos;administrateur du site.
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
