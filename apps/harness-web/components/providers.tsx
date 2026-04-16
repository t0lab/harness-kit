"use client";

import { PropsWithChildren } from "react";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";

import { TooltipProvider } from "@/components/ui/tooltip";

import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delay={120}>
        {children}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
