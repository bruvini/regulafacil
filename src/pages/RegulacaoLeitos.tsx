
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import ImportacaoResumoModal from '@/components/modals/ImportacaoResumoModal';
import * as XLSX from 'xlsx';

interface PacienteImportado {
  nomePaciente: string;
  dataNascimento: string;
  sexo: string;
  dataInternacao: string;
  setor: string;
  leito: string;
  especialidade: string;
}

const RegulacaoLeitos = () => {
  const [resumo, setResumo] = useState<Record<string, PacienteImportado[]> | null>(null);
  const [isModalResumoOpen, setIsModalResumoOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const processarDadosImportados = (dados: any[][]) => {
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
    
    // Agrupar por setor
    const pacientesAgrupados: Record<string, PacienteImportado[]> = {};
    pacientes.forEach(paciente => {
      if (!pacientesAgrupados[paciente.setor]) {
        pacientesAgrupados[paciente.setor] = [];
      }
      pacientesAgrupados[paciente.setor].push(paciente);
    });
    
    console.log('Resumo agrupado por setor:', pacientesAgrupados);
    
    setResumo(pacientesAgrupados);
    setIsModalResumoOpen(true);
    
    toast({
      title: 'Sucesso',
      description: `Arquivo importado com sucesso! ${pacientes.length} pacientes processados.`,
    });
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
        const json_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
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

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-medical-primary">Central de Regulação</h1>
            <p className="text-muted-foreground">Importe e gerencie o censo de pacientes do hospital.</p>
          </div>
          
          {/* Card de Importação */}
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-medical-primary">
                Importar Censo de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Faça upload da planilha Excel de censo para importar os dados dos pacientes automaticamente.
                </p>
                
                <Button
                  onClick={handleImportClick}
                  variant="medical"
                  size="lg"
                  disabled={isProcessing}
                  className="mx-auto"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {isProcessing ? 'Processando...' : 'Importar Planilha'}
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
      
      <ImportacaoResumoModal
        open={isModalResumoOpen}
        onOpenChange={setIsModalResumoOpen}
        resumo={resumo}
      />
    </div>
  );
};

export default RegulacaoLeitos;
