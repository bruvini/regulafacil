
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Edit, Trash2, Settings, Shield, Wrench } from 'lucide-react';
import { useUsuarios, Usuario } from '@/hooks/useUsuarios';
import { useSistemaConfig } from '@/hooks/useSistemaConfig';
import { useAuth } from '@/hooks/useAuth';
import { UsuarioForm } from '@/components/forms/UsuarioForm';

const GestaoUsuarios = () => {
  const { usuarios, loading, criarUsuario, atualizarUsuario, excluirUsuario } = useUsuarios();
  const { modoManutencaoAtivo, toggleModoManutencao } = useSistemaConfig();
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [senhaManutencao, setSenhaManutencao] = useState('');

  const handleOpenModal = (user: Usuario | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    let success = false;
    if (editingUser) {
      success = await atualizarUsuario(editingUser.id!, data);
    } else {
      success = await criarUsuario(data);
    }

    if (success) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (id: string, uid?: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      await excluirUsuario(id, uid);
    }
  };

  const handleMaintenanceToggle = async () => {
    const success = await toggleModoManutencao(senhaManutencao);
    if (success) {
      setIsMaintenanceDialogOpen(false);
      setSenhaManutencao('');
    }
  };

  const getTipoAcessoBadge = (tipo: string) => {
    return tipo === 'Administrador' ? (
      <Badge variant="default">Administrador</Badge>
    ) : (
      <Badge variant="secondary">Comum</Badge>
    );
  };

  const isAdmin = userData?.tipoAcesso === 'Administrador';

  return (
    <>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-lg bg-medical-primary flex items-center justify-center">
                  <Settings className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-medical-primary mb-4">
                Gestão de Usuários
              </h1>
              <p className="text-lg text-muted-foreground">
                Adicione, edite e gerencie os usuários do sistema RegulaFacil
              </p>
            </div>

            {/* Painel de Controle de Manutenção - Visível apenas para Administradores */}
            {isAdmin && (
              <Card className="mb-6 border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Shield className="h-5 w-5" />
                    Controle de Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800">Modo de Manutenção</span>
                      </div>
                      <Switch 
                        checked={modoManutencaoAtivo} 
                        disabled 
                        className="data-[state=checked]:bg-amber-600"
                      />
                      <Badge variant={modoManutencaoAtivo ? "destructive" : "secondary"}>
                        {modoManutencaoAtivo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => setIsMaintenanceDialogOpen(true)}
                      variant="outline"
                      className="border-amber-600 text-amber-800 hover:bg-amber-100"
                    >
                      Alterar Status
                    </Button>
                  </div>
                  <p className="text-sm text-amber-700 mt-2">
                    Quando ativo, todos os usuários serão redirecionados para a página de manutenção.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Usuários Cadastrados</h2>
                <p className="text-muted-foreground">
                  Total de {usuarios.length} usuário(s) no sistema
                </p>
              </div>
              <Button onClick={() => handleOpenModal()} variant="medical">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
            </div>

            <Card className="shadow-card border border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-medical-primary">
                  Lista de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-muted-foreground">Carregando usuários...</p>
                  </div>
                ) : usuarios.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhum usuário cadastrado ainda.
                      <br />
                      Clique em "Adicionar Usuário" para começar.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Tipo de Acesso</TableHead>
                        <TableHead>Acessos</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((user) => {
                        const ultimoAcesso = user.historicoAcessos && user.historicoAcessos.length > 0
                          ? new Date(user.historicoAcessos[user.historicoAcessos.length - 1].toDate()).toLocaleString('pt-BR')
                          : 'Nunca';

                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.nomeCompleto}
                            </TableCell>
                            <TableCell>{user.matricula}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {getTipoAcessoBadge(user.tipoAcesso)}
                            </TableCell>
                            <TableCell>{user.historicoAcessos?.length || 0}</TableCell>
                            <TableCell>{ultimoAcesso}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenModal(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteUser(user.id!, user.uid)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <UsuarioForm 
            onSubmit={handleFormSubmit} 
            initialData={editingUser} 
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Modo de Manutenção</AlertDialogTitle>
            <AlertDialogDescription>
              Para {modoManutencaoAtivo ? 'desativar' : 'ativar'} o modo de manutenção, 
              insira a senha de administração do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="senha">Senha de Manutenção</Label>
            <Input
              id="senha"
              type="password"
              value={senhaManutencao}
              onChange={(e) => setSenhaManutencao(e.target.value)}
              placeholder="Digite a senha de manutenção"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSenhaManutencao('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleMaintenanceToggle}>
              {modoManutencaoAtivo ? 'Desativar' : 'Ativar'} Manutenção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GestaoUsuarios;
