
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  UserPlus, 
  ArrowRightLeft, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { PlanoDeMudancas } from '@/types/hospital';

interface ReconciliationPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planoDeMudancas: PlanoDeMudancas | null;
  onConfirm: () => void;
  isExecuting?: boolean;
}

const ReconciliationPreviewModal = ({ 
  open, 
  onOpenChange, 
  planoDeMudancas, 
  onConfirm,
  isExecuting = false
}: ReconciliationPreviewModalProps) => {

  if (!planoDeMudancas) return null;

  const { novasAdmissoes, movimentacoes, aguardandoRegulacao, pendenciasAlta, totalAcoes } = planoDeMudancas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-medical-primary flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            Plano de Reconciliação do Censo
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Resumo Executivo */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Resumo Executivo</CardTitle>
              <CardDescription>
                O sistema identificou <strong>{totalAcoes} ações</strong> necessárias para sincronizar o censo atual com a planilha importada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{novasAdmissoes.length}</div>
                  <div className="text-sm text-muted-foreground">Novas Admissões</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{movimentacoes.length}</div>
                  <div className="text-sm text-muted-foreground">Movimentações</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{aguardandoRegulacao.length}</div>
                  <div className="text-sm text-muted-foreground">Aguard. Regulação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{pendenciasAlta.length}</div>
                  <div className="text-sm text-muted-foreground">Pendências Alta</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Novas Admissões */}
          {novasAdmissoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <UserPlus className="h-5 w-5" />
                  Novas Admissões ({novasAdmissoes.length})
                </CardTitle>
                <CardDescription>
                  Pacientes que serão registrados no sistema e ocuparão leitos disponíveis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {novasAdmissoes.map((admissao, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <div className="font-medium">{admissao.paciente.nomePaciente}</div>
                        <div className="text-sm text-muted-foreground">
                          {admissao.paciente.sexo} • {admissao.paciente.dataNascimento} • {admissao.paciente.especialidade}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {admissao.paciente.leitoAtual}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Movimentações */}
          {movimentacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <ArrowRightLeft className="h-5 w-5" />
                  Movimentações de Leito ({movimentacoes.length})
                </CardTitle>
                <CardDescription>
                  Pacientes que mudaram de leito e precisam ter sua localização atualizada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {movimentacoes.map((mov, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <div className="font-medium">{mov.nomePaciente}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>De: {mov.leitoOrigemId}</span>
                          <ArrowRightLeft className="h-3 w-3" />
                          <span>Para: {mov.leitoDestinoId}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Movimentação
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aguardando Regulação */}
          {aguardandoRegulacao.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-5 w-5" />
                  Aguardando Regulação ({aguardandoRegulacao.length})
                </CardTitle>
                <CardDescription>
                  Pacientes em setores especiais que precisam de regulação médica para definir o leito adequado.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {aguardandoRegulacao.map((reg, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div>
                        <div className="font-medium">{reg.paciente.nomePaciente}</div>
                        <div className="text-sm text-muted-foreground">
                          {reg.paciente.sexo} • {reg.paciente.especialidade}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        {reg.motivo === 'ps_decisao' ? 'PS Decisão' : 'CC Recuperação'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pendências de Alta */}
          {pendenciasAlta.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Pendências de Alta/Transferência ({pendenciasAlta.length})
                </CardTitle>
                <CardDescription>
                  Pacientes que estavam no sistema mas não aparecem na nova planilha. Requerem confirmação manual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pendenciasAlta.map((pendencia, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <div className="font-medium">{pendencia.nomePaciente}</div>
                        <div className="text-sm text-muted-foreground">
                          {pendencia.setorAtual} • {pendencia.leitoAtual}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Revisar
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExecuting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isExecuting}
              className="bg-medical-primary hover:bg-medical-secondary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isExecuting ? 'Aplicando Mudanças...' : 'Confirmar e Aplicar Mudanças'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationPreviewModal;
