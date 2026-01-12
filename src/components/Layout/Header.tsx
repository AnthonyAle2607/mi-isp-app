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
    <header className="bg-gradient-to-r from-[hsl(216,71%,10%)] to-[hsl(216,71%,15%)] backdrop-blur-lg border-b border-border/30 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img 
            src={silverdataLogo} 
            alt="Silverdata Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-wide">
              <span className="text-white">SILVER</span>
              <span className="text-primary">DATA</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Portal de Autogestión</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" className="relative hidden sm:flex hover:bg-secondary/50">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
            <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-primary rounded-full animate-pulse"></span>
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[150px]">{user?.email || 'Cliente ISP'}</p>
              <p className="text-xs text-primary font-medium">
                {isAdmin ? 'Administrador' : 'Cliente Silverdata'}
              </p>
            </div>
            <ProfileDialog />
          </div>
          
          {isAdmin && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/network')}
                className="border-primary/50 text-primary hover:bg-primary/10 hidden sm:flex text-xs"
              >
                <Network className="h-3 w-3 mr-1" />
                Red
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate('/admin-home')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground hidden sm:flex text-xs"
              >
                Inicio Admin
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="hover:bg-destructive/20">
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;