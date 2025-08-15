
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, Clock } from 'lucide-react';

interface LeitoHigienizacao {
  id: string;
  codigoLeito: string;
  tempoEsperaFormatado: string;
  tempoEsperaMinutos: number;
  higienizacaoPrioritaria?: boolean;
  setor: string;
}

interface ListaHigienizacaoProps {
  leitosAgrupados: Record<string, LeitoHigienizacao[]>;
  onConcluir: (leito: LeitoHigienizacao) => Promise<void>;
}

const ListaHigienizacao = ({ leitosAgrupados, onConcluir }: ListaHigienizacaoProps) => {
  const setores = Object.keys(leitosAgrupados).sort();

  if (setores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum leito aguardando higienização</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {setores.map(setor => {
        const leitosDoSetor = leitosAgrupados[setor];
        const leitosPrioritarios = leitosDoSetor.filter(l => l.higienizacaoPrioritaria);
        const leitosNormais = leitosDoSetor.filter(l => !l.higienizacaoPrioritaria);
        
        return (
          <Card key={setor} className="border-l-4 border-l-medical-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{setor}</span>
                <div className="flex items-center gap-2">
                  {leitosPrioritarios.length > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                      {leitosPrioritarios.length} prioritário{leitosPrioritarios.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {leitosDoSetor.length} {leitosDoSetor.length === 1 ? 'leito' : 'leitos'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {/* Renderizar leitos prioritários primeiro */}
                {leitosPrioritarios.map(leito => (
                  <div
                    key={leito.id}
                    className="flex items-center justify-between p-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <p className="font-medium text-foreground">
                          Leito {leito.codigoLeito}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Aguardando há {leito.tempoEsperaFormatado}</span>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            PRIORITÁRIO
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onConcluir(leito)}
                      className="bg-medical-success hover:bg-medical-success/90"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Concluir
                    </Button>
                  </div>
                ))}

                {/* Renderizar leitos normais */}
                {leitosNormais.map(leito => (
                  <div
                    key={leito.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          Leito {leito.codigoLeito}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Aguardando há {leito.tempoEsperaFormatado}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => onConcluir(leito)}
                      className="bg-medical-success hover:bg-medical-success/90"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Concluir
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ListaHigienizacao;
