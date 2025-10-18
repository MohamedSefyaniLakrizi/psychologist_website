"use client";

import { Suspense } from "react";
import { LoginForm } from "../components/login/login-form";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <div className="flex w-screen h-screen justify-center items-center">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <LoginFormWrapper />
      </Suspense>
    </div>
  );
}
