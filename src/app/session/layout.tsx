import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Interview Session | askaisl",
};

export default function SessionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
