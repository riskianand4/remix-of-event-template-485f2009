import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, FileText, Clock, Zap } from "lucide-react";

const technicianBottomNavItems = [
  {
    title: "Dashboard",
    url: "/technician",
    icon: Home,
  },
  {
    title: "Generate",
    url: "/technician/reports",
    icon: FileText,
  },
  {
    title: "Aktivasi",
    url: "/technician/activation",
    icon: Zap,
  },
  {
    title: "Riwayat",
    url: "/technician/history",
    icon: Clock,
  },
];

export function TechnicianMobileBottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border/50 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around px-2 py-0.5 pb-safe mobile-safe-bottom">
        {technicianBottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.url === "/technician"
              ? currentPath === "/technician" 
              : currentPath === item.url ||
                currentPath.startsWith(item.url + "/");

          return (
            <NavLink
              key={item.title}
              to={item.url}
              className="flex flex-col items-center justify-center min-w-0 flex-1 px-1"
            >
              <motion.div
                className={`flex flex-col items-center justify-center gap-0.5 p-1 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isActive ? "bg-primary/15 shadow-lg" : "hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium truncate max-w-full leading-tight">
                  {item.title}
                </span>
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 bg-primary rounded-full mt-0.5"
                    layoutId="technicianMobileActiveIndicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}
