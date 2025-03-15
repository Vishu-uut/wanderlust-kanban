import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Wanderlust-Kanban App",
  description: "A simple Kanban board app built with Next.js and Tailwind CSS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
