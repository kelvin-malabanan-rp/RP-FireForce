import { ReactNode } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "../animations/PageTransition";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className = "" }: MainLayoutProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-xl font-bold text-primary cursor-pointer"
          >
            Your App
          </motion.h1>
        </div>
        
        <nav className="flex items-center space-x-4">
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Home
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/about"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            About
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/contact"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Contact
          </motion.a>
        </nav>
      </div>
    </motion.header>
  );
}

function Footer() {
  return (
    <motion.footer
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 Your App. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
