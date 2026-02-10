import "./globals.css";

export const metadata = {
  title: "PharmaGPT — AI Medicine Assistant",
  description: "Search medicines by symptoms and chat with an AI-powered pharmaceutical assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
