
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Edit, Trash2, Settings } from 'lucide-react';
import { useUsuarios, Usuario } from '@/hooks/useUsuarios';
import { UsuarioForm } from '@/components/forms/UsuarioForm';

const GestaoUsuarios = () => {
  const { usuarios, loading, criarUsuario, atualizarUsuario, excluirUsuario } = useUsuarios();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const handleOpenModal = (user: Usuario | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // FASE 1: CORRIGIR FLUXO DE VALIDAÇÃO - SÓ FECHA O MODAL SE A OPERAÇÃO FOR BEM-SUCEDIDA
  const handleFormSubmit = async (data: any) => {
    let success = false;
    if (editingUser) {
      success = await atualizarUsuario(editingUser.id!, data);
    } else {
      success = await criarUsuario(data);
    }

    // SÓ FECHA O MODAL SE A OPERAÇÃO RETORNAR SUCESSO
    if (success) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  // FASE 4: AJUSTAR FUNÇÃO DE EXCLUSÃO PARA PASSAR UID
  const handleDeleteUser = async (id: string, uid?: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      await excluirUsuario(id, uid);
    }
  };

  const getTipoAcessoBadge = (tipo: string) => {
    return tipo === 'Administrador' ? (
      <Badge variant="default">Administrador</Badge>
    ) : (
      <Badge variant="secondary">Comum</Badge>
    );
  };

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
                        <TableHead>Acessos</TableHead> {/* FASE 3: NOVA COLUNA */}
                        <TableHead>Último Acesso</TableHead> {/* FASE 3: NOVA COLUNA */}
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map((user) => {
                        // FASE 3: LÓGICA PARA HISTÓRICO DE ACESSO
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
                            <TableCell>{user.historicoAcessos?.length || 0}</TableCell> {/* FASE 3: NOVA CÉLULA */}
                            <TableCell>{ultimoAcesso}</TableCell> {/* FASE 3: NOVA CÉLULA */}
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
    </>
  );
};

export default GestaoUsuarios;
