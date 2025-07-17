import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import { useSetores } from '@/hooks/useSetores';
import SetorForm from '../forms/SetorForm';
import LeitoForm from '../forms/LeitoForm';
import { SetorFormData, LeitoFormData } from '@/types/hospital';

interface GerenciamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GerenciamentoModal = ({ open, onOpenChange }: GerenciamentoModalProps) => {
  const {
    setores,
    loading,
    criarSetor,
    atualizarSetor,
    excluirSetor,
    adicionarLeito,
    adicionarLeitosEmLote,
    atualizarLeito,
    excluirLeito,
  } = useSetores();

  const [editingSetor, setEditingSetor] = useState<{ id: string; data: SetorFormData } | null>(null);
  const [editingLeito, setEditingLeito] = useState<{ 
    setorId: string; 
    leitoIndex: number; 
    data: LeitoFormData 
  } | null>(null);
  const [selectedSetorForLeitos, setSelectedSetorForLeitos] = useState('');

  const handleSetorSubmit = async (data: SetorFormData) => {
    if (editingSetor) {
      await atualizarSetor(editingSetor.id, data);
      setEditingSetor(null);
    } else {
      // Add leitos property to match Setor interface
      const setorData = { ...data, leitos: [] };
      await criarSetor(setorData);
    }
  };

  const handleLeitoSubmit = async (setorId: string, data: LeitoFormData) => {
    if (editingLeito) {
      await atualizarLeito(editingLeito.setorId, editingLeito.leitoIndex.toString(), data);
      setEditingLeito(null);
    } else {
      // Split only by comma and trim whitespace
      const leitoCodigos = data.codigoLeito
        .split(',')
        .map(codigo => codigo.trim())
        .filter(codigo => codigo.length > 0);
      
      if (leitoCodigos.length === 1) {
        // Single bed creation
        await adicionarLeito(setorId, data);
      } else {
        // Batch bed creation - create all beds at once to avoid concurrency issues
        const setor = setores.find(s => s.id === setorId);
        if (!setor) {
          console.error('Setor não encontrado');
          return;
        }

        const novosLeitos = leitoCodigos.map(codigoLeito => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Unique ID
          codigoLeito,
          statusLeito: 'Vago' as const,
          leitoPCP: data.leitoPCP || false,
          leitoIsolamento: data.leitoIsolamento || false,
          dataAtualizacaoStatus: new Date().toISOString(),
          dadosPaciente: null
        }));

        // Call the batch creation function
        await adicionarLeitosEmLote(setorId, novosLeitos);
      }
      
      // Reset the form after successful submission
      setEditingLeito(null);
    }
  };

  const handleEditSetor = (setor: any) => {
    setEditingSetor({
      id: setor.id,
      data: { nomeSetor: setor.nomeSetor, siglaSetor: setor.siglaSetor }
    });
  };

  const handleEditLeito = (setorId: string, leitoIndex: number, leito: any) => {
    setEditingLeito({
      setorId,
      leitoIndex,
      data: {
        codigoLeito: leito.codigoLeito,
        leitoPCP: leito.leitoPCP,
        leitoIsolamento: leito.leitoIsolamento
      }
    });
  };

  const handleResetSetorForm = () => {
    setEditingSetor(null);
  };

  const handleResetLeitoForm = () => {
    setEditingLeito(null);
  };

  const selectedSetor = setores.find(s => s.id === selectedSetorForLeitos);

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
          
          <TabsContent value="setores" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingSetor ? 'Editar Setor' : 'Novo Setor'}
                </h3>
                <SetorForm
                  onSubmit={handleSetorSubmit}
                  initialData={editingSetor?.data}
                  isLoading={loading}
                  onReset={handleResetSetorForm}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Setores Cadastrados</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {setores.map((setor) => (
                    <Card key={setor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{setor.nomeSetor}</h4>
                            <p className="text-sm text-muted-foreground">{setor.siglaSetor}</p>
                            <p className="text-xs text-muted-foreground">
                              {setor.leitos.length} leito(s) cadastrado(s)
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
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setor.id && excluirSetor(setor.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="leitos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {editingLeito ? 'Editar Leito' : 'Novo Leito'}
                </h3>
                <LeitoForm
                  onSubmit={handleLeitoSubmit}
                  setores={setores}
                  selectedSetorId={editingLeito?.setorId || selectedSetorForLeitos}
                  initialData={editingLeito?.data}
                  isLoading={loading}
                  onReset={handleResetLeitoForm}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Leitos por Setor</h3>
                <div className="space-y-4">
                  <select
                    className="w-full p-2 border border-border rounded-md"
                    value={selectedSetorForLeitos}
                    onChange={(e) => setSelectedSetorForLeitos(e.target.value)}
                  >
                    <option value="">Selecione um setor</option>
                    {setores.map((setor) => (
                      <option key={setor.id} value={setor.id}>
                        {setor.nomeSetor} ({setor.siglaSetor})
                      </option>
                    ))}
                  </select>
                  
                  {selectedSetor && (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {selectedSetor.leitos.map((leito, index) => (
                        <Card key={index}>
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
                                  onClick={() => handleEditLeito(selectedSetor.id!, index, leito)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => excluirLeito(selectedSetor.id!, index.toString())}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {selectedSetor.leitos.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum leito cadastrado neste setor
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
