
// src/components/modals/GerenciamentoModal.tsx

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { useSetores } from '@/hooks/useSetores';
import { useLeitos } from '@/hooks/useLeitos';
import SetorForm from '../forms/SetorForm';
import LeitoForm from '../forms/LeitoForm';
import { SetorFormData, LeitoFormData, Leito, Setor } from '@/types/hospital';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface GerenciamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GerenciamentoModal = ({ open, onOpenChange }: GerenciamentoModalProps) => {
  const { setores, loading: setoresLoading, criarSetor, atualizarSetor, excluirSetor } = useSetores();
  const { leitos, loading: leitosLoading, adicionarLeito, atualizarLeito, excluirLeito } = useLeitos();

  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [editingLeito, setEditingLeito] = useState<Leito | null>(null);
  const [selectedSetorForLeitos, setSelectedSetorForLeitos] = useState('');

  const handleSetorSubmit = async (data: SetorFormData) => {
    if (editingSetor) {
      await atualizarSetor(editingSetor.id!, data);
    } else {
      await criarSetor(data);
    }
    setEditingSetor(null);
  };

  const handleLeitoSubmit = async (setorId: string, data: LeitoFormData) => {
    try {
      if (editingLeito) {
        await atualizarLeito(editingLeito.id!, data);
      } else {
        await adicionarLeito(setorId, data);
      }
      setEditingLeito(null);
    } catch (error) {
      console.error('Erro ao submeter leito:', error);
    }
  };

  const handleEditSetor = (setor: Setor) => {
    setEditingSetor(setor);
  };

  const handleEditLeito = (leito: Leito) => {
    setEditingLeito(leito);
  };
  
  const handleResetSetorForm = () => {
    setEditingSetor(null);
  };

  const handleResetLeitoForm = () => {
    setEditingLeito(null);
  };

  const leitosDoSetorSelecionado = leitos.filter(l => l.setorId === selectedSetorForLeitos);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-medical-primary">
            Gerenciar Setores e Leitos
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="setores" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setores">Setores</TabsTrigger>
            <TabsTrigger value="leitos">Leitos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setores" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingSetor ? `Editando: ${editingSetor.nomeSetor}` : 'Novo Setor'}
                </h3>
                <SetorForm
                  onSubmit={handleSetorSubmit}
                  initialData={editingSetor ? { nomeSetor: editingSetor.nomeSetor, siglaSetor: editingSetor.siglaSetor } : undefined}
                  isLoading={setoresLoading}
                  onReset={handleResetSetorForm}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Setores Cadastrados</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {setores.map((setor) => (
                    <Card key={setor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{setor.nomeSetor}</h4>
                            <p className="text-sm text-muted-foreground">{setor.siglaSetor}</p>
                            <p className="text-xs text-muted-foreground">
                              {leitos.filter(l => l.setorId === setor.id).length} leito(s) cadastrado(s)
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSetor(setor)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o setor "{setor.nomeSetor}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => setor.id && excluirSetor(setor.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leitos" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingLeito ? `Editando: ${editingLeito.codigoLeito}` : 'Novo Leito'}
                </h3>
                <LeitoForm
                  onSubmit={handleLeitoSubmit}
                  setores={setores}
                  selectedSetorId={editingLeito?.setorId || selectedSetorForLeitos}
                  initialData={editingLeito ? { 
                    codigoLeito: editingLeito.codigoLeito, 
                    tipoLeito: editingLeito.tipoLeito,
                    leitoPCP: editingLeito.leitoPCP, 
                    leitoIsolamento: editingLeito.leitoIsolamento 
                  } : undefined}
                  isLoading={leitosLoading}
                  onReset={handleResetLeitoForm}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Leitos por Setor</h3>
                <div className="space-y-4">
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={selectedSetorForLeitos}
                    onChange={(e) => {
                      setSelectedSetorForLeitos(e.target.value);
                      setEditingLeito(null); // Reseta a edição ao trocar de setor
                    }}
                  >
                    <option value="">Selecione um setor para ver os leitos</option>
                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nomeSetor} ({setor.siglaSetor})
                      </option>
                    ))}
                  </select>
                  
                  {selectedSetorForLeitos && (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {leitosDoSetorSelecionado.map((leito) => (
                        <Card key={leito.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{leito.codigoLeito}</h4>
                                <div className="flex space-x-2 text-xs text-muted-foreground">
                                  {leito.leitoPCP && <span>PCP</span>}
                                  {leito.leitoIsolamento && <span>Isolamento</span>}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLeito(leito)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o leito "{leito.codigoLeito}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => leito.id && excluirLeito(leito.id)}>Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {leitosDoSetorSelecionado.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum leito cadastrado neste setor.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciamentoModal;
