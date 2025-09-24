import { Button } from "@/components/ui/button";
import { Bell, User, LogOut, Wifi } from "lucide-react";
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
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-tech-blue to-tech-blue-dark rounded-lg">
            <Wifi className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ISPConnect</h1>
            <p className="text-sm text-muted-foreground">Portal de Autogestión</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-warning-orange rounded-full"></span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.email || 'Cliente ISP'}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Administrador' : 'Plan Premium'}
              </p>
            </div>
            <ProfileDialog />
          </div>
          
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/admin')}
              className="text-white border-white/20 hover:bg-white/20"
            >
              Panel Admin
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;