import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { History, LogOut, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { clear, identity } = useInternetIdentity();

  const handleLogout = () => {
    clear();
    onNavigate("login");
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 h-16"
    >
      <div className="glass-strong h-full border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate("predictor")}
            className="flex items-center gap-2 group"
            data-ocid="nav.link"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">
              InstaPredict
            </span>
          </button>

          {identity && (
            <nav className="flex items-center gap-1">
              <Button
                variant={currentPage === "predictor" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onNavigate("predictor")}
                className="gap-2"
                data-ocid="nav.predict.link"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Predict</span>
              </Button>
              <Button
                variant={currentPage === "history" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onNavigate("history")}
                className="gap-2"
                data-ocid="nav.history.link"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2 text-muted-foreground hover:text-destructive"
                data-ocid="nav.logout.button"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </nav>
          )}
        </div>
      </div>
    </motion.header>
  );
}
