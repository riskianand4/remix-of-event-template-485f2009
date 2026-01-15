import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Trash2, CheckCheck, RefreshCw, Zap, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePSBRealtimeNotifications } from '@/hooks/usePSBRealtimeNotifications';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const PSBNotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isPolling,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refresh,
  } = usePSBRealtimeNotifications();

  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: {
    id: string;
    activationId: string;
    read: boolean;
  }) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the activation page
    if (notification.activationId) {
      setOpen(false);
      navigate(`/technician/activation/${notification.activationId}/signature`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_activation':
        return <Zap className="w-4 h-4 text-primary" />;
      case 'assignment':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                variant="destructive" 
                className="h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </motion.div>
          )}
          {isPolling && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-1 -right-1"
            >
              <RefreshCw className="w-3 h-3 text-primary animate-spin" />
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Notifikasi PSB</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                disabled={isPolling}
                className="h-8 w-8"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-8"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tandai Dibaca
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearAll}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Hapus Semua"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-80">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center text-muted-foreground"
              >
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Tidak ada notifikasi</p>
                <p className="text-xs mt-1">Notifikasi aktivasi baru akan muncul di sini</p>
              </motion.div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`border-b last:border-b-0 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div 
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(notification.timestamp, 'dd MMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-7 w-7 p-0"
                            title="Tandai dibaca"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Hapus"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false);
                navigate('/technician/activation');
              }}
              className="w-full text-xs"
            >
              Lihat Semua Aktivasi
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PSBNotificationCenter;
