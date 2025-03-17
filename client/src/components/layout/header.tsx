import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gamepad, Menu, User, ChevronDown, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function Header() {
  const { t, language, setLanguage } = useI18n();
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-md"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-heading font-bold text-white">
              <Gamepad className="inline-block mr-2 text-accent" />
              <span>{t("title")}</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {user && (
              <>
                <Link 
                  href="/"
                  className={`nav-link ${
                    location === "/" ? "text-white active" : "text-gray-300"
                  } font-medium hover:text-white`}
                >
                  {t("home")}
                </Link>
                <Link 
                  href="/rankings"
                  className={`nav-link ${
                    location === "/rankings"
                      ? "text-white active"
                      : "text-gray-300"
                  } font-medium hover:text-white`}
                >
                  {t("rankings")}
                </Link>
                <Link 
                  href="/alliances"
                  className={`nav-link ${
                    location === "/alliances"
                      ? "text-white active"
                      : "text-gray-300"
                  } font-medium hover:text-white`}
                >
                  {t("allianceRankings")}
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {/* User dropdown & logout button (visible when logged in) */}
            {user && (
              <div className="flex items-center">
                <span className="text-sm text-gray-300 mr-2 hidden sm:inline">
                  {user.username}
                </span>
                <Link 
                  href="/"
                  className="text-accent hover:text-accent-hover"
                >
                  <User className="h-5 w-5" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  className="ml-2 text-gray-400 hover:text-white"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Language Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center text-sm font-medium text-gray-300 hover:text-white"
                >
                  <span>{language === "ru" ? "РУС" : "ENG"}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("ru")}>
                  Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={ref}
            className="md:hidden mt-4 pb-4 flex flex-col space-y-3 animate-in slide-in-from-top"
          >
            {user ? (
              <>
                <Link 
                  href="/"
                  className="text-white font-medium"
                >
                  {t("home")}
                </Link>
                <Link 
                  href="/rankings"
                  className="text-gray-300 hover:text-white"
                >
                  {t("rankings")}
                </Link>
                <Link 
                  href="/alliances"
                  className="text-gray-300 hover:text-white"
                >
                  {t("allianceRankings")}
                </Link>
              </>
            ) : (
              <Link 
                href="/auth"
                className="text-white font-medium"
              >
                {t("login")}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Animated border line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"></div>
    </motion.header>
  );
}
