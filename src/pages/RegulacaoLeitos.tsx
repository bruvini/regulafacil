
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface PacienteImportado {
  nomePaciente: string;
  dataNascimento: string;
  sexo: string;
  dataInternacao: string;
  setor: string;
  leito: string;
  especialidade: string;
}

interface ResumoImportacao {
  [setor: string]: PacienteImportado[];
}

const RegulacaoLeitos = () => {
  const [resumoImportacao, setResumoImportacao] = useState<ResumoImportacao | null>(null);
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
    
    dadosProcessados.forEach((row, index) => {
      // Verificar se a linha tem dados suficientes
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
    const resumo: ResumoImportacao = {};
    pacientes.forEach(paciente => {
      if (!resumo[paciente.setor]) {
        resumo[paciente.setor] = [];
      }
      resumo[paciente.setor].push(paciente);
    });
    
    console.log('Resumo agrupado por setor:', resumo);
    
    setResumoImportacao(resumo);
    
    toast({
      title: 'Sucesso',
      description: `Arquivo importado com sucesso! ${pacientes.length} pacientes processados.`,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Verificar se é um arquivo CSV ou Excel
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo CSV ou Excel (.csv, .xls, .xlsx).',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Resultado do Papa.parse:', results);
        setIsProcessing(false);
        processarDadosImportados(results.data as any[][]);
      },
      error: (error) => {
        console.error('Erro ao ler o arquivo:', error);
        setIsProcessing(false);
        toast({
          title: 'Erro',
          description: 'Erro ao processar o arquivo. Verifique se o formato está correto.',
          variant: 'destructive',
        });
      }
    });
    
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
                  Faça upload da planilha de censo para importar os dados dos pacientes automaticamente.
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
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <p className="text-sm text-muted-foreground">
                  Formatos suportados: CSV, XLS, XLSX
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Card de Resumo */}
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-medical-primary">
                Resumo da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!resumoImportacao ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Aguardando importação de arquivo...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      Arquivo importado com sucesso!
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    <h3 className="font-semibold text-lg">Pacientes por Setor:</h3>
                    <ul className="space-y-2">
                      {Object.entries(resumoImportacao).map(([setor, pacientes]) => (
                        <li key={setor} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{setor}</span>
                          <span className="bg-medical-primary text-white px-3 py-1 rounded-full text-sm">
                            {pacientes.length} pacientes
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Total geral:</strong> {Object.values(resumoImportacao).reduce((total, pacientes) => total + pacientes.length, 0)} pacientes importados
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegulacaoLeitos;
