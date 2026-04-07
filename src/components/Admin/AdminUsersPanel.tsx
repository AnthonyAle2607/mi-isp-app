import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronDown, ChevronUp, Eye, Edit, Settings2, UserPlus, ChevronLeft, ChevronRight, X } from 'lucide-react';
import EditUserDialog from '@/components/Dashboard/EditUserDialog';
import EditTechnicalDataDialog from '@/components/Dashboard/EditTechnicalDataDialog';
import CreateUserDialog from '@/components/Dashboard/CreateUserDialog';
import ClientDetailSheet from '@/components/Admin/ClientDetailSheet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  ip_address?: string;
  contract_number?: string;
  plan_type: string;
  account_status: string;
  created_at: string;
  cedula?: string;
  cedula_type?: string;
  connection_type?: string;
  node?: string;
  olt_equipment?: string;
  sector?: string;
  pending_balance?: number;
  next_billing_date?: string;
  last_payment_date?: string;
  installation_date?: string;
  plan_id?: string;
  estado?: string;
  municipio?: string;
  parroquia?: string;
  calle?: string;
  casa?: string;
  nap_box?: string;
  nap_port?: string;
  onu_serial?: string;
  link_type?: string;
  technical_equipment?: string;
  ctif_notes?: string;
  birth_date?: string;
  gender?: string;
  permanence_months?: number;
}

interface AdminUsersPanelProps {
  profiles: Profile[];
  userRoles: { id: string; user_id: string; role: string; created_at: string }[];
  onRefresh: () => void;
  makeUserAdmin: (userId: string) => void;
}

const PAGE_SIZE = 15;

const AdminUsersPanel = ({ profiles, userRoles, onRefresh, makeUserAdmin }: AdminUsersPanelProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionFilter, setConnectionFilter] = useState<string>('all');
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('full_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const getUserRole = (userId: string) => userRoles.find(r => r.user_id === userId)?.role || 'user';

  // Unique nodes for filter
  const uniqueNodes = useMemo(() => {
    const nodes = profiles.map(p => p.node).filter(Boolean) as string[];
    return [...new Set(nodes)].sort();
  }, [profiles]);

  // Filter & search
  const filtered = useMemo(() => {
    let result = [...profiles];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.cedula || '').includes(q) ||
        (p.ip_address || '').includes(q) ||
        (p.contract_number || '').toLowerCase().includes(q) ||
        (p.phone || '').includes(q) ||
        (p.onu_serial || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') result = result.filter(p => p.account_status === statusFilter);
    if (connectionFilter !== 'all') result = result.filter(p => p.connection_type === connectionFilter);
    if (nodeFilter !== 'all') result = result.filter(p => p.node === nodeFilter);

    // Sort
    result.sort((a, b) => {
      const aVal = (a as any)[sortField] || '';
      const bVal = (b as any)[sortField] || '';
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [profiles, search, statusFilter, connectionFilter, nodeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const hasActiveFilters = statusFilter !== 'all' || connectionFilter !== 'all' || nodeFilter !== 'all' || search !== '';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setConnectionFilter('all');
    setNodeFilter('all');
    setPage(1);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      active: { label: 'Activo', cls: 'bg-success-green/10 text-success-green border-success-green/20' },
      suspended: { label: 'Suspendido', cls: 'bg-destructive/10 text-destructive border-destructive/20' },
      inactive: { label: 'Inactivo', cls: 'bg-muted text-muted-foreground border-border' },
    };
    const s = map[status] || map.inactive;
    return <Badge variant="secondary" className={s.cls}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gestión de Clientes</h3>
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {profiles.length} clientes
              {hasActiveFilters && ' (filtrado)'}
            </p>
          </div>
          <CreateUserDialog onUserCreated={onRefresh} />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula, IP, contrato, serial ONU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="suspended">Suspendidos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={connectionFilter} onValueChange={v => { setConnectionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Conexión" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="fibra">Fibra</SelectItem>
              <SelectItem value="radio">Radio</SelectItem>
            </SelectContent>
          </Select>
          {uniqueNodes.length > 0 && (
            <Select value={nodeFilter} onValueChange={v => { setNodeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nodo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueNodes.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                <span className="flex items-center gap-1">Cliente <SortIcon field="full_name" /></span>
              </TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('account_status')}>
                <span className="flex items-center gap-1">Estado <SortIcon field="account_status" /></span>
              </TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('next_billing_date')}>
                <span className="flex items-center gap-1">F. Corte <SortIcon field="next_billing_date" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('pending_balance')}>
                <span className="flex items-center gap-1">Deuda <SortIcon field="pending_balance" /></span>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            )}
            {paginated.map(profile => {
              const role = getUserRole(profile.user_id);
              return (
                <TableRow key={profile.id} className="group">
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{profile.full_name || 'Sin nombre'}</span>
                      {role === 'admin' && <Badge variant="default" className="ml-2 text-[10px] px-1.5 py-0">Admin</Badge>}
                      <div className="text-xs text-muted-foreground">{profile.contract_number || '—'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {profile.cedula_type || 'V'}-{profile.cedula || '—'}
                  </TableCell>
                  <TableCell>{statusBadge(profile.account_status)}</TableCell>
                  <TableCell className="text-xs">{profile.plan_type || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{profile.ip_address || '—'}</TableCell>
                  <TableCell className="text-xs">
                    {profile.next_billing_date
                      ? format(new Date(profile.next_billing_date), 'dd/MM/yy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${(profile.pending_balance || 0) > 0 ? 'text-destructive' : 'text-success-green'}`}>
                      ${(profile.pending_balance || 0).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedProfile(profile)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <EditUserDialog profile={profile} userRole={role} onUpdate={onRefresh} />
                      <EditTechnicalDataDialog profile={profile} onUpdate={onRefresh} />
                      {role !== 'admin' && (
                        <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => makeUserAdmin(profile.user_id)}>
                          Admin
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Sheet */}
      {selectedProfile && (
        <ClientDetailSheet
          profile={selectedProfile}
          userRole={getUserRole(selectedProfile.user_id)}
          open={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
};

export default AdminUsersPanel;
