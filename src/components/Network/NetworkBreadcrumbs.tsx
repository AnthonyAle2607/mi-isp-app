import { ChevronRight, Network, MapPin, Router } from "lucide-react";
import type { NetworkDevice } from "@/pages/NetworkManagement";

interface NetworkBreadcrumbsProps {
  currentNode: NetworkDevice | null;
  selectedDevice: NetworkDevice | null;
  onNavigateHome: () => void;
  onNavigateToNode: () => void;
}

const NetworkBreadcrumbs = ({ 
  currentNode, 
  selectedDevice, 
  onNavigateHome, 
  onNavigateToNode 
}: NetworkBreadcrumbsProps) => {
  return (
    <nav className="flex items-center gap-1 text-sm">
      <button 
        onClick={onNavigateHome}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
          !currentNode 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Network className="h-4 w-4" />
        <span>Red</span>
      </button>
      
      {currentNode && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button 
            onClick={onNavigateToNode}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              !selectedDevice 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>{currentNode.location || currentNode.name}</span>
          </button>
        </>
      )}
      
      {selectedDevice && currentNode && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary font-medium rounded-md">
            <Router className="h-4 w-4" />
            <span className="font-mono text-xs">{selectedDevice.ip_address}</span>
          </span>
        </>
      )}
    </nav>
  );
};

export default NetworkBreadcrumbs;
