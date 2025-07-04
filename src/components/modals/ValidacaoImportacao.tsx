
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCopy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export interface ResultadoValidacao {
  setoresFaltantes: string[];
  leitosFaltantes: Record<string, string[]>;
}

export interface SyncSummary {
  novasInternacoes: PacienteDaPlanilha[];
  transferencias: { paciente: PacienteDaPlanilha; leitoAntigo: string }[];
  altas: { nomePaciente: string; leitoAntigo: string }[];
}

export interface PacienteDaPlanilha {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: 'Masculino' | 'Feminino';
  dataInternacao: string;
  setorNome: string;
  leitoCodigo: string;
  especialidade: string;
}

interface ValidacaoImportacaoProps {
  resultado?: ResultadoValidacao;
  syncSummary?: SyncSummary;
  onContinue: () => void;
  onConfirmSync?: () => void;
  isSyncing?: boolean;
}

export const ValidacaoImportacao = ({ resultado, syncSummary, onContinue, onConfirmSync, isSyncing = false }: ValidacaoImportacaoProps) => {
  const { toast } = useToast();

  const handleCopyToClipboard = (text: string, type: 'setor' | 'leito') => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `Lista de ${type === 'setor' ? 'setores' : 'leitos'} copiada para a área de transferência.`,
    });
  };

  // Scenario 1: Validation Results
  if (resultado) {
    const temInconsistencias = resultado.setoresFaltantes.length > 0 || Object.keys(resultado.leitosFaltantes).length > 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
          <div>
            <h3 className="font-bold">Ação Necessária</h3>
            <p className="text-sm">Foram encontrados setores e/ou leitos na planilha que não estão cadastrados no sistema. Por favor, cadastre-os antes de prosseguir.</p>
          </div>
        </div>

        {temInconsistencias ? (
          <div className="grid md:grid-cols-2 gap-6">
            {resultado.setoresFaltantes.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Setores a Cadastrar</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside bg-muted p-3 rounded-md">
                    {resultado.setoresFaltantes.map(setor => <li key={setor}>{setor}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}

            {Object.keys(resultado.leitosFaltantes).length > 0 && (
              <div className={resultado.setoresFaltantes.length > 0 ? '' : 'md:col-span-2'}>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Leitos a Cadastrar</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(resultado.leitosFaltantes).map(([setor, leitos]) => {
                      const leitosString = leitos.join(', ');
                      return (
                        <div key={setor}>
                          <h4 className="font-semibold">{setor}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm bg-muted p-2 rounded-md flex-grow break-all">{leitosString}</p>
                            <Button size="sm" variant="ghost" onClick={() => handleCopyToClipboard(leitosString, 'leito')}>
                              <ClipboardCopy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
           <p className="text-center text-green-700 font-medium">Nenhuma inconsistência encontrada. Tudo pronto para a Etapa 2.</p>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onContinue} disabled={temInconsistencias}>
            {temInconsistencias ? 'Corrija para continuar' : 'Sincronizar Pacientes'}
          </Button>
        </div>
      </div>
    );
  }

  // Scenario 2: Sync Summary Results
  if (syncSummary) {
    const totalMudancas = syncSummary.novasInternacoes.length + syncSummary.transferencias.length + syncSummary.altas.length;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="font-bold">Resumo das Mudanças</h3>
            <p className="text-sm">Analise cuidadosamente as alterações que serão realizadas antes de confirmar.</p>
          </div>
        </div>

        <div className="grid gap-6">
          {syncSummary.novasInternacoes.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg text-green-700">Novas Internações ({syncSummary.novasInternacoes.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncSummary.novasInternacoes.map((paciente, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="font-medium">{paciente.nomeCompleto}</span>
                      <span className="text-sm text-muted-foreground">{paciente.leitoCodigo} - {paciente.setorNome}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {syncSummary.transferencias.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg text-blue-700">Transferências ({syncSummary.transferencias.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncSummary.transferencias.map((transferencia, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                      <span className="font-medium">{transferencia.paciente.nomeCompleto}</span>
                      <span className="text-sm text-muted-foreground">{transferencia.leitoAntigo} → {transferencia.paciente.leitoCodigo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {syncSummary.altas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg text-red-700">Altas ({syncSummary.altas.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {syncSummary.altas.map((alta, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="font-medium">{alta.nomePaciente}</span>
                      <span className="text-sm text-muted-foreground">Liberando leito {alta.leitoAntigo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalMudancas === 0 && (
            <p className="text-center text-gray-600 font-medium">Nenhuma mudança detectada. O sistema já está sincronizado.</p>
          )}
        </div>

        {isSyncing && (
          <div className="space-y-2 pt-4">
            <p className="text-sm font-medium text-center text-medical-primary">Sincronizando dados, por favor aguarde...</p>
            <Progress value={undefined} className="w-full animate-pulse" />
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onConfirmSync} disabled={totalMudancas === 0 || isSyncing}>
            {!isSyncing && `Confirmar e Sincronizar ${totalMudancas > 0 ? `(${totalMudancas} alterações)` : ''}`}
            {isSyncing && 'Sincronizando...'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
