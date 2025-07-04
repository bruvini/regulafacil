
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCopy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ResultadoValidacao {
  setoresFaltantes: string[];
  leitosFaltantes: Record<string, string[]>;
}

interface ValidacaoImportacaoProps {
  resultado: ResultadoValidacao;
  onContinue: () => void;
}

export const ValidacaoImportacao = ({ resultado, onContinue }: ValidacaoImportacaoProps) => {
  const { toast } = useToast();

  const handleCopyToClipboard = (text: string, type: 'setor' | 'leito') => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `Lista de ${type === 'setor' ? 'setores' : 'leitos'} copiada para a área de transferência.`,
    });
  };

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
        <Button onClick={onContinue} disabled={true} title="Funcionalidade em desenvolvimento">
          Continuar para Importação (Etapa 2)
        </Button>
      </div>
    </div>
  );
};
