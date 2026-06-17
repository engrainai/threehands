import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Three Hands Vintage",
  description: "Curated vintage watches from the 1930s through the 1970s."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Three Hands Vintage home">
            <span>Three</span>
            <span>Hands</span>
            <span>Vintage</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/products">Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <p>Three Hands Vintage</p>
            <span>Tucson, Arizona</span>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/products">Shop</Link>
            <Link href="/about">About</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
