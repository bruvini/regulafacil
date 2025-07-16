
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Trash2, Search } from 'lucide-react';
import { useAuditoriaLogs } from '@/hooks/useAuditoriaLogs';
import { useUsuarios } from '@/hooks/useUsuarios';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';

const paginasSistema = ["Mapa de Leitos", "Regulação de Leitos", "Gestão de Isolamentos", "Marcação Cirúrgica", "Gestão de Usuários"];

const Auditoria = () => {
  const { logs, loading, deleteAllLogs } = useAuditoriaLogs();
  const { usuarios } = useUsuarios();
  const [filtros, setFiltros] = useState({
    texto: '',
    pagina: '',
    usuarioId: '',
    dataInicio: '',
    dataFim: ''
  });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const dataLog = log.data.toDate();
      if (filtros.texto && !log.acao.toLowerCase().includes(filtros.texto.toLowerCase()) && !log.usuario.nome.toLowerCase().includes(filtros.texto.toLowerCase())) return false;
      if (filtros.pagina && log.origem !== filtros.pagina) return false;
      if (filtros.usuarioId && log.usuario.uid !== filtros.usuarioId) return false;
      if (filtros.dataInicio && dataLog < new Date(filtros.dataInicio)) return false;
      if (filtros.dataFim && dataLog > new Date(filtros.dataFim)) return false;
      return true;
    });
  }, [logs, filtros]);

  const handleFiltroChange = (field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div className="w-16 h-16 rounded-lg bg-purple-600 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-medical-primary mb-2">
                Trilha de Auditoria
              </h1>
              <p className="text-lg text-muted-foreground">
                Monitoramento de todas as ações realizadas no sistema
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Limpar Logs
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Limpeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá apagar permanentemente todos os registros de auditoria. 
                    Não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllLogs}>
                    Confirmar e Apagar Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Card className="shadow-card border border-border/50 mb-6">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-medical-primary">
                Filtros de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar por ação, usuário ou origem..." 
                  className="pl-10"
                  value={filtros.texto}
                  onChange={(e) => handleFiltroChange('texto', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={filtros.pagina} onValueChange={(v) => handleFiltroChange('pagina', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Página" />
                  </SelectTrigger>
                  <SelectContent>
                    {paginasSistema.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtros.usuarioId} onValueChange={(v) => handleFiltroChange('usuarioId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map(u => (
                      <SelectItem key={u.uid} value={u.uid!}>{u.nomeCompleto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="datetime-local" 
                  placeholder="Data Início"
                  value={filtros.dataInicio} 
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value)} 
                />
                <Input 
                  type="datetime-local" 
                  placeholder="Data Fim"
                  value={filtros.dataFim} 
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border/50 bg-slate-900 text-slate-200 font-mono">
            <CardHeader>
              <CardTitle className="text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs do Sistema ({filteredLogs.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[60vh] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-400">Carregando logs...</p>
                  </div>
                )}
                
                {!loading && filteredLogs.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-slate-400">Nenhum log encontrado</p>
                  </div>
                )}
                
                {!loading && filteredLogs.map(log => (
                  <div key={log.id} className="flex flex-col lg:flex-row lg:items-start gap-2 text-sm py-1 hover:bg-slate-800/50 px-2 rounded">
                    <span className="text-green-400 whitespace-nowrap font-medium">
                      [{log.data?.toDate ? new Date(log.data.toDate()).toLocaleString('pt-BR') : 'Data inválida'}]
                    </span>
                    <span className="text-cyan-400 whitespace-nowrap font-medium">
                      [{log.usuario.nome}]
                    </span>
                    <span className="text-yellow-400 whitespace-nowrap font-medium">
                      [{log.origem}]
                    </span>
                    <span className="text-slate-200 flex-1 break-words">
                      {log.acao}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auditoria;
