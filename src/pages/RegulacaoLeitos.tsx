
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ValidacaoCensoModal from '@/components/modals/ValidacaoCensoModal';
import ReconciliationPreviewModal from '@/components/modals/ReconciliationPreviewModal';
import { useSetores } from '@/hooks/useSetores';
import { useReconciliation } from '@/hooks/useReconciliation';
import * as XLSX from 'xlsx';
import { PacienteImportado, ResultadoValidacao } from '@/types/hospital';

const RegulacaoLeitos = () => {
  const [resultadoValidacao, setResultadoValidacao] = useState<ResultadoValidacao | null>(null);
  const [isModalValidacaoOpen, setIsModalValidacaoOpen] = useState(false);
  const [isModalReconciliationOpen, setIsModalReconciliationOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setores } = useSetores();
  const { 
    loading: reconciliationLoading, 
    planoDeMudancas, 
    reconciliarCenso, 
    executarPlanoDeMudancas 
  } = useReconciliation();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const validarDadosImportados = (dados: PacienteImportado[]): ResultadoValidacao => {
    console.log('Validando dados importados:', dados);
    
    let pacientesValidados = 0;
    const discrepancias: Record<string, string[]> = {};
    
    dados.forEach(paciente => {
      // Encontrar o setor correspondente
      const setorEncontrado = setores.find(s => s.nomeSetor === paciente.setor);
      
      if (setorEncontrado) {
        // Verificar se o leito existe no setor
        const leitoEncontrado = setorEncontrado.leitos.find(l => l.codigoLeito === paciente.leito);
        
        if (leitoEncontrado) {
          pacientesValidados++;
        } else {
          // Leito não encontrado - adicionar às discrepâncias
          if (!discrepancias[paciente.setor]) {
            discrepancias[paciente.setor] = [];
          }
          if (!discrepancias[paciente.setor].includes(paciente.leito)) {
            discrepancias[paciente.setor].push(paciente.leito);
          }
        }
      } else {
        // Setor não encontrado - adicionar às discrepâncias
        if (!discrepancias[paciente.setor]) {
          discrepancias[paciente.setor] = [];
        }
        if (!discrepancias[paciente.setor].includes(paciente.leito)) {
          discrepancias[paciente.setor].push(paciente.leito);
        }
      }
    });
    
    const validacaoCompleta = Object.keys(discrepancias).length === 0;
    
    return {
      pacientesValidados,
      discrepancias,
      validacaoCompleta
    };
  };

  const processarDadosImportados = async (dados: any[][]) => {
    console.log('Dados brutos recebidos:', dados);
    
    // Ignorar as 3 primeiras linhas (cabeçalho)
    const dadosProcessados = dados.slice(3);
    
    const pacientes: PacienteImportado[] = [];
    
    dadosProcessados.forEach((row) => {
      // Verificar se a linha tem dados suficientes e nome válido
      if (row && row.length >= 8 && row[0] && row[4] && row[6]) {
        const paciente: PacienteImportado = {
          nomePaciente: row[0]?.toString().trim() || '',
          dataNascimento: row[1]?.toString().trim() || '',
          sexo: row[2]?.toString().trim() || '',
          dataInternacao: row[3]?.toString().trim() || '',
          setor: row[4]?.toString().trim() || '',
          leito: row[6]?.toString().trim() || '',
          especialidade: row[7]?.toString().trim() || ''
        };
        
        pacientes.push(paciente);
      }
    });
    
    console.log('Pacientes processados:', pacientes);
    
    // Validar dados
    const resultadoValidacao = validarDadosImportados(pacientes);
    
    if (!resultadoValidacao.validacaoCompleta) {
      // Mostrar modal de validação com pendências
      setResultadoValidacao(resultadoValidacao);
      setIsModalValidacaoOpen(true);
      
      toast({
        title: 'Validação Incompleta',
        description: 'Existem setores ou leitos não cadastrados. Cadastre-os primeiro antes de prosseguir.',
        variant: 'destructive',
      });
      return;
    }

    // Validação 100% bem-sucedida - prosseguir com reconciliação
    try {
      console.log('Iniciando processo de reconciliação...');
      const plano = await reconciliarCenso(pacientes, setores);
      
      if (plano.totalAcoes > 0) {
        setIsModalReconciliationOpen(true);
        toast({
          title: 'Reconciliação Preparada',
          description: `${plano.totalAcoes} ações identificadas. Revise o plano antes de aplicar.`,
        });
      } else {
        toast({
          title: 'Censo Sincronizado',
          description: 'Nenhuma mudança necessária. O censo já está atualizado.',
        });
      }
    } catch (error) {
      console.error('Erro na reconciliação:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Verificar se é um arquivo Excel
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo Excel (.xls ou .xlsx).',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converte a planilha para um array de arrays
        const json_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        console.log('Dados extraídos da planilha:', json_data);
        setIsProcessing(false);
        processarDadosImportados(json_data);

      } catch (error) {
        console.error("Erro ao processar o arquivo Excel:", error);
        setIsProcessing(false);
        toast({
          title: 'Erro',
          description: 'Erro ao processar o arquivo Excel. Verifique se o formato está correto.',
          variant: 'destructive',
        });
      }
    };

    reader.onerror = (error) => {
      console.error("Erro ao ler o arquivo:", error);
      setIsProcessing(false);
      toast({
        title: 'Erro',
        description: 'Erro ao ler o arquivo. Tente novamente.',
        variant: 'destructive',
      });
    };

    reader.readAsArrayBuffer(file);
    
    // Limpar o input para permitir seleção do mesmo arquivo novamente
    event.target.value = '';
  };

  const handleConfirmReconciliation = async () => {
    if (planoDeMudancas) {
      try {
        await executarPlanoDeMudancas(planoDeMudancas);
        setIsModalReconciliationOpen(false);
      } catch (error) {
        console.error('Erro ao executar reconciliação:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">Central de Regulação</h1>
            <p className="text-muted-foreground">Motor inteligente de reconciliação de censo hospitalar.</p>
          </div>
          
          {/* Card de Importação */}
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-medical-primary">
                Motor de Reconciliação de Censo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Importe a planilha de censo e o sistema irá comparar com o estado atual, 
                  identificando automaticamente admissões, movimentações e pendências.
                </p>
                
                <Button
                  onClick={handleImportClick}
                  variant="medical"
                  size="lg"
                  disabled={isProcessing || reconciliationLoading}
                  className="mx-auto"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processando...' : 
                   reconciliationLoading ? 'Reconciliando...' : 
                   'Iniciar Reconciliação'}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <p className="text-sm text-muted-foreground">
                  Formatos suportados: XLS, XLSX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <ValidacaoCensoModal
        open={isModalValidacaoOpen}
        onOpenChange={setIsModalValidacaoOpen}
        resultado={resultadoValidacao}
      />

      <ReconciliationPreviewModal
        open={isModalReconciliationOpen}
        onOpenChange={setIsModalReconciliationOpen}
        planoDeMudancas={planoDeMudancas}
        onConfirm={handleConfirmReconciliation}
        isExecuting={reconciliationLoading}
      />
    </div>
  );
};

export default RegulacaoLeitos;
