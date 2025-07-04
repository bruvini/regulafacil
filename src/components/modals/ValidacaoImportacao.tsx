
import { CheckCircle, AlertTriangle, LogIn, ArrowRightLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export interface ResultadoValidacao {
  setoresFaltantes: string[];
  leitosFaltantes: Record<string, string[]>;
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

export interface SyncSummary {
  novasInternacoes: PacienteDaPlanilha[];
  transferencias: { paciente: PacienteDaPlanilha; leitoAntigo: string }[];
  altas: { nomePaciente: string; leitoAntigo: string }[];
}

interface ValidacaoImportacaoProps {
  resultado: ResultadoValidacao | null;
  syncSummary: SyncSummary | null;
  onContinue: () => void;
  onConfirmSync: () => void;
  isSyncing: boolean;
}

export const ValidacaoImportacao = ({ 
  resultado, 
  syncSummary, 
  onContinue, 
  onConfirmSync,
  isSyncing 
}: ValidacaoImportacaoProps) => {
  
  // Cenário 1: Resultado de validação (setores/leitos faltantes)
  if (resultado) {
    const temInconsistencias = resultado.setoresFaltantes.length > 0 || Object.keys(resultado.leitosFaltantes).length > 0;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 p-4 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Validação da Planilha</h3>
            <p className="text-sm">Alguns setores ou leitos da planilha não foram encontrados no sistema.</p>
          </div>
        </div>

        {resultado.setoresFaltantes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 dark:text-red-300">Setores não encontrados ({resultado.setoresFaltantes.length}):</h4>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded max-h-32 overflow-y-auto">
              <ul className="list-disc list-inside text-sm space-y-1">
                {resultado.setoresFaltantes.map((setor, index) => (
                  <li key={index} className="text-red-800 dark:text-red-200">{setor}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {Object.keys(resultado.leitosFaltantes).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700 dark:text-red-300">Leitos não encontrados:</h4>
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded max-h-32 overflow-y-auto">
              {Object.entries(resultado.leitosFaltantes).map(([setor, leitos]) => (
                <div key={setor} className="mb-2">
                  <p className="font-medium text-red-800 dark:text-red-200">{setor}:</p>
                  <p className="text-sm text-red-700 dark:text-red-300 ml-4">{leitos.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onContinue} disabled={temInconsistencias}>
            {temInconsistencias ? 'Corrija para continuar' : 'Sincronizar Pacientes'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Cenário 2: Resumo de sincronização (cards totalizadores)
  if (syncSummary) {
    const totalMudancas = syncSummary.novasInternacoes.length + syncSummary.transferencias.length + syncSummary.altas.length;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
          <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Resumo da Sincronização</h3>
            <p className="text-sm">Revise os totais de mudanças abaixo. Se estiver tudo correto, confirme para aplicar as alterações no sistema.</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <Card className="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-green-700 dark:text-green-300">{syncSummary.novasInternacoes.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4"/>Novas Internações
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-orange-700 dark:text-orange-300">{syncSummary.transferencias.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300 flex items-center justify-center gap-2">
                <ArrowRightLeft className="h-4 w-4"/>Transferências
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl text-red-700 dark:text-red-300">{syncSummary.altas.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4"/>Altas / Saídas
              </p>
            </CardContent>
          </Card>
        </div>

        {totalMudancas === 0 && (
          <p className="text-center text-muted-foreground pt-4">
            Nenhuma mudança detectada. O sistema já está sincronizado com a planilha.
          </p>
        )}

        {/* Barra de progresso durante sincronização */}
        {isSyncing && (
          <div className="space-y-2 pt-4">
            <p className="text-sm font-medium text-center text-medical-primary">Sincronizando dados, por favor aguarde...</p>
            <Progress value={undefined} className="w-full animate-pulse" />
          </div>
        )}

        {/* Botão de confirmação */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onConfirmSync} disabled={totalMudancas === 0 || isSyncing}>
            {isSyncing ? 'Sincronizando...' : `Confirmar e Sincronizar ${totalMudancas > 0 ? `(${totalMudancas} alterações)` : ''}`}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
