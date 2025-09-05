import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuditoriaLogs, FiltrosLogs } from '@/hooks/useAuditoriaLogs'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { PAGINAS_SISTEMA } from '@/lib/constants'

const Auditoria = () => {
  const [filtros, setFiltros] = useState<FiltrosLogs>({
    texto: '',
    usuarioId: 'todos',
    dataInicio: null,
    dataFim: null,
    pagina: '',
  })
  const { logs, loading, limparTodosOsLogs } = useAuditoriaLogs(filtros)
  const { usuarios } = useUsuarios()
  const { userData } = useAuth()

  const handleChange = (
    field: keyof FiltrosLogs,
    value: string | Date | null
  ) => {
    setFiltros(prev => ({ ...prev, [field]: value }))
  }

  const resetFiltros = () => {
    setFiltros({ texto: '', usuarioId: 'todos', dataInicio: null, dataFim: null, pagina: '' })
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar..."
                value={filtros.texto}
                onChange={e => handleChange('texto', e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Usuário</label>
                <Select
                  value={filtros.usuarioId}
                  onValueChange={v => handleChange('usuarioId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Usuários</SelectItem>
                    {usuarios.map(u => (
                      <SelectItem key={u.uid} value={u.uid!}>
                        {u.nomeCompleto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Data de Início</label>
                <Input
                  type="datetime-local"
                  value={
                    filtros.dataInicio
                      ? format(filtros.dataInicio, "yyyy-MM-dd'T'HH:mm")
                      : ''
                  }
                  onChange={e =>
                    handleChange(
                      'dataInicio',
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Data de Fim</label>
                <Input
                  type="datetime-local"
                  value={
                    filtros.dataFim
                      ? format(filtros.dataFim, "yyyy-MM-dd'T'HH:mm")
                      : ''
                  }
                  onChange={e =>
                    handleChange(
                      'dataFim',
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium">Página</label>
                <Select
                  value={filtros.pagina}
                  onValueChange={v => handleChange('pagina', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as Páginas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as Páginas</SelectItem>
                    {PAGINAS_SISTEMA.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetFiltros}>
                Limpar Filtros
              </Button>
              {userData?.tipoAcesso === 'Administrador' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Limpar Logs</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é irreversível e removerá todos os registros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={limparTodosOsLogs}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Tabela */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Página</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{log.usuario}</TableCell>
                    <TableCell>{log.pagina}</TableCell>
                    <TableCell className="break-all">{log.acao}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auditoria

