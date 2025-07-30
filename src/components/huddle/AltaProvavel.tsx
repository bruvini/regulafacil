
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MessageSquare } from 'lucide-react';
import { ObservacoesAprimoradaModal } from '@/components/modals/ObservacoesAprimoradaModal';
import { Paciente, Leito, Setor } from '@/types/hospital';

interface Props {
  pacientes: Paciente[];
  leitos: Leito[];
  setores: Setor[];
  onAdicionarObservacao: (pacienteId: string, observacao: string, tipo: 'obsAltaProvavel') => void;
  onRemoverObservacao: (pacienteId: string, observacaoId: string, tipo: 'obsAltaProvavel') => void;
}

export const AltaProvavel = ({ 
  pacientes, 
  leitos, 
  setores, 
  onAdicionarObservacao, 
  onRemoverObservacao 
}: Props) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  const pacientesAltaProvavel = pacientes.filter(p => p.provavelAlta);

  const getSetorNome = (setorId: string) => {
    const setor = setores.find(s => s.id === setorId);
    return setor ? setor.nomeSetor : 'Setor não encontrado';
  };

  const getLeitoNome = (leitoId: string) => {
    const leito = leitos.find(l => l.id === leitoId);
    return leito ? leito.codigoLeito : 'Leito não encontrado';
  };

  const abrirObservacoes = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Alta Provável / Alta no Leito
            <Badge variant="secondary">{pacientesAltaProvavel.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pacientesAltaProvavel.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum paciente com alta provável
            </p>
          ) : (
            <div className="space-y-3">
              {pacientesAltaProvavel.map((paciente) => (
                <div key={paciente.id} className="border rounded-lg p-4 bg-green-50/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{paciente.nomeCompleto}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getSetorNome(paciente.setorId)} - Leito {getLeitoNome(paciente.leitoId)}
                      </p>
                      {paciente.obsAltaProvavel && paciente.obsAltaProvavel.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {paciente.obsAltaProvavel.length} observação(ões)
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirObservacoes(paciente)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Observações
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pacienteSelecionado && (
        <ObservacoesAprimoradaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          pacienteNome={pacienteSelecionado.nomeCompleto}
          observacoes={pacienteSelecionado.obsAltaProvavel || []}
          onConfirm={(texto) => onAdicionarObservacao(pacienteSelecionado.id, texto, 'obsAltaProvavel')}
          onDelete={(observacaoId) => onRemoverObservacao(pacienteSelecionado.id, observacaoId, 'obsAltaProvavel')}
        />
      )}
    </>
  );
};
