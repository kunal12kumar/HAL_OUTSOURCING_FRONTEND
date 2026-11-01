import "./globals.css";

export const metadata = {
  title: "HAL Tejas Division - Outsourcing",
  description: "Outsourcing workflow for HAL Tejas Division and its vendors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
