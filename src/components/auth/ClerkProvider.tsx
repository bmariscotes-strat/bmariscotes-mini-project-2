import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ClerkLayoutProps {
  children: ReactNode;
}

export default function ClerkLayout({ children }: ClerkLayoutProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb", // Blue-600
          colorText: "#1f2937", // Gray-800
          colorTextSecondary: "#6b7280", // Gray-500
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937",
          borderRadius: "0.5rem",
        },
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
          footerActionLink: "text-blue-600 hover:text-blue-700",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
