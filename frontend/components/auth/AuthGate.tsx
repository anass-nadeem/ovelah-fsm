"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { clearToken, getToken } from "@/lib/auth";

const API_URL = "http://127.0.0.1:8000";

// Guards against wrapping window.fetch more than once (e.g. React
// Strict Mode runs effects twice in development).
let fetchIsPatched = false;

function patchFetchWithAuth(
  onUnauthorized: () => void
) {
  if (fetchIsPatched) return;
  fetchIsPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    const isApiRequest = url.startsWith(API_URL);

    if (!isApiRequest) {
      return originalFetch(input, init);
    }

    const token = getToken();

    const headers = new Headers(init?.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await originalFetch(input, {
      ...init,
      headers,
    });

    // Any API call coming back 401 means the token is missing,
    // wrong, or expired - bounce to the login page uniformly,
    // rather than every single page having to handle this itself.
    if (response.status === 401 && !url.includes("/auth/login")) {
      onUnauthorized();
    }

    return response;
  };
}

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    function handleUnauthorized() {
      clearToken();
      router.push("/login");
    }

    patchFetchWithAuth(handleUnauthorized);

    if (isLoginPage) {
      setChecked(true);
      return;
    }

    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    setChecked(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Avoid flashing real page content before the redirect to
  // /login happens for an unauthenticated visitor.
  if (!checked) {
    return null;
  }

  return <>{children}</>;
}