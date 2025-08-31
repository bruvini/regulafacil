
// src/components/ListasLaterais.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AguardandoUTIItem } from './AguardandoUTIItem';
import { AguardandoTransferenciaItem } from './AguardandoTransferenciaItem';
import { CirurgiaEletivaItem } from './CirurgiaEletivaItem';
import { Paciente } from '@/types/hospital';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSetores } from '@/hooks/useSetores';

interface ListasLateraisProps {
  pacientesAguardandoUTI: any[];
  pacientesAguardandoTransferencia: any[];
  cirurgias: any[];
  onCancelarUTI: (paciente: Paciente) => void;
  onTransferirExterna: (paciente: any) => void;
  onRegularUTI: (paciente: any) => void;
  onGerenciarTransferencia: (paciente: any) => void;
  onAlocarCirurgia: (cirurgia: any) => void;
}

export const ListasLaterais = ({
  pacientesAguardandoUTI,
  pacientesAguardandoTransferencia,
  cirurgias,
  onCancelarUTI,
  onTransferirExterna,
  onRegularUTI,
  onGerenciarTransferencia,
  onAlocarCirurgia
}: ListasLateraisProps) => {
  const handleCancelarTransferencia = async (paciente: any) => {
    const pacienteRef = doc(db, "pacientesRegulaFacil", paciente.id);
    await updateDoc(pacienteRef, { transferirPaciente: false });
  };
  const { setores } = useSetores();
  const mapaSetores = new Map(setores.map((s) => [s.id, s]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {pacientesAguardandoUTI.length > 0 && (
        <Card className="shadow-card border border-border/50">
          <CardHeader className="flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-base font-semibold">
              Aguardando UTI
            </CardTitle>
            <Badge variant="secondary">
              {pacientesAguardandoUTI.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {pacientesAguardandoUTI.map((p) => (
                <AguardandoUTIItem
                  key={p.id}
                  paciente={p}
                  onCancel={() => onCancelarUTI(p)}
                  onTransfer={() => onTransferirExterna(p)}
                  onRegularUTI={() => onRegularUTI(p)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pacientesAguardandoTransferencia.length > 0 && (
        <Card className="shadow-card border border-border/50">
          <CardHeader className="flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-base font-semibold">
              Aguardando Transferência
            </CardTitle>
            <Badge variant="secondary">
              {pacientesAguardandoTransferencia.length}
            </Badge>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {pacientesAguardandoTransferencia.map((p) => {
                const setorDoPaciente = mapaSetores.get(p.setorId);
                return (
                  <AguardandoTransferenciaItem
                    key={p.id}
                    paciente={p}
                    onCancel={() => handleCancelarTransferencia(p)}
                    onGerenciar={() => onGerenciarTransferencia(p)}
                    siglaSetorOrigem={setorDoPaciente?.siglaSetor || 'N/A'}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {cirurgias.length > 0 && (
        <Card className="shadow-card border border-border/50">
          <CardHeader className="flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-base font-semibold">
              Cirurgias Eletivas (Próx. 48h)
            </CardTitle>
            <Badge variant="secondary">{cirurgias.length}</Badge>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {cirurgias.map((c) => (
                <CirurgiaEletivaItem
                  key={c.id}
                  cirurgia={c}
                  onAlocarLeito={onAlocarCirurgia}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
