import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Wifi, Network } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ProfileDialog from './ProfileDialog';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-card/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap sm:flex-nowrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-r from-tech-blue to-tech-blue-dark rounded-lg">
            <Wifi className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-foreground">Silverdata</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Portal de Autogestión</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-warning-orange rounded-full"></span>
          </Button>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[150px]">{user?.email || 'Cliente ISP'}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Administrador' : 'Plan Premium'}
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
                className="text-foreground border-border/50 hover:bg-secondary hidden sm:flex text-xs"
              >
                <Network className="h-3 w-3 mr-1" />
                Red
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin-home')}
                className="text-foreground border-border/50 hover:bg-secondary hidden sm:flex text-xs"
              >
                Inicio Admin
              </Button>
            </>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;