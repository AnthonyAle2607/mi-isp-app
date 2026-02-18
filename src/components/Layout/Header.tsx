import { Button } from "@/components/ui/button";
import { Bell, LogOut, Network } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ProfileDialog from './ProfileDialog';
import silverdataLogo from '@/assets/silverdata-logo.png';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/40 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={silverdataLogo}
              alt="Silverdata Logo"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-success-green rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold leading-none">
              <span className="text-foreground">SILVER</span>
              <span className="gradient-text">DATA</span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block leading-none mt-0.5">Portal de Autogestión</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification bell */}
          <Button variant="ghost" size="icon" className="relative hidden sm:flex hover:bg-secondary/60 h-9 w-9">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
          </Button>

          {/* User info + profile */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium text-foreground truncate max-w-[160px]">{user?.email || 'Cliente ISP'}</p>
              <p className="text-xs text-primary">{isAdmin ? 'Administrador' : 'Cliente Silverdata'}</p>
            </div>
            <ProfileDialog />
          </div>

          {/* Admin shortcuts */}
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/network')}
                className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground gap-1.5 h-8"
              >
                <Network className="h-3.5 w-3.5" />
                Red
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/admin-home')}
                className="hidden sm:flex text-xs h-8 shine"
              >
                Admin
              </Button>
            </>
          )}

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 hover:bg-destructive/15 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;