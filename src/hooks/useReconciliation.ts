
import { useState } from 'react';
import { 
  collection, 
  getDocs, 
  writeBatch,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Paciente, 
  PacienteImportado, 
  PlanoDeMudancas,
  AcaoReconciliacao,
  NovaAdmissao,
  MovimentacaoLeito,
  AguardandoRegulacao,
  PendenciaAlta,
  Setor,
  HistoricoStatus
} from '@/types/hospital';
import { useToast } from '@/hooks/use-toast';

// Função para normalizar nomes (maiúsculas, sem acentos)
const normalizarNome = (nome: string): string => {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export const useReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const [planoDeMudancas, setPlanoDeMudancas] = useState<PlanoDeMudancas | null>(null);
  const { toast } = useToast();

  const buscarPacientesExistentes = async (): Promise<Paciente[]> => {
    const pacientesSnapshot = await getDocs(collection(db, 'pacientesRegulaFacil'));
    return pacientesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Paciente[];
  };

  const encontrarPacientePorNome = (pacientes: Paciente[], nomeNormalizado: string, dataNascimento: string): Paciente | null => {
    return pacientes.find(p => 
      p.nomeNormalizado === nomeNormalizado && 
      p.dataNascimento === dataNascimento
    ) || null;
  };

  const encontrarLeitoPorCodigo = (setores: Setor[], nomeSetor: string, codigoLeito: string) => {
    const setor = setores.find(s => s.nomeSetor === nomeSetor);
    if (!setor) return null;
    
    const leito = setor.leitos.find(l => l.codigoLeito === codigoLeito);
    if (!leito) return null;
    
    return { setor, leito };
  };

  const reconciliarCenso = async (
    dadosImportados: PacienteImportado[], 
    setores: Setor[]
  ): Promise<PlanoDeMudancas> => {
    try {
      setLoading(true);
      console.log('Iniciando reconciliação de censo...');

      // Buscar pacientes existentes
      const pacientesExistentes = await buscarPacientesExistentes();
      console.log('Pacientes existentes encontrados:', pacientesExistentes.length);

      const novasAdmissoes: NovaAdmissao[] = [];
      const movimentacoes: MovimentacaoLeito[] = [];
      const aguardandoRegulacao: AguardandoRegulacao[] = [];
      const pendenciasAlta: PendenciaAlta[] = [];

      // Processar cada paciente da planilha
      for (const pacienteImportado of dadosImportados) {
        const nomeNormalizado = normalizarNome(pacienteImportado.nomePaciente);
        
        // Verificar se o paciente já existe
        const pacienteExistente = encontrarPacientePorNome(
          pacientesExistentes, 
          nomeNormalizado, 
          pacienteImportado.dataNascimento
        );

        // Encontrar setor e leito de destino
        const destinoInfo = encontrarLeitoPorCodigo(
          setores, 
          pacienteImportado.setor, 
          pacienteImportado.leito
        );

        if (!destinoInfo) {
          console.warn(`Leito não encontrado: ${pacienteImportado.setor} - ${pacienteImportado.leito}`);
          continue;
        }

        // Verificar localizações especiais
        const isPS = pacienteImportado.setor.includes('PS DECISÃO') || 
                    pacienteImportado.setor.includes('PS DECISAO');
        const isCC = pacienteImportado.setor.includes('CC - RECUPERAÇÃO') || 
                    pacienteImportado.setor.includes('CC - RECUPERACAO');

        if (isPS) {
          // Regra 1: PS DECISÃO sempre vai para aguardando regulação
          const novoPaciente: Paciente = {
            id: pacienteExistente?.id || crypto.randomUUID(),
            nomePaciente: pacienteImportado.nomePaciente,
            nomeNormalizado,
            dataNascimento: pacienteImportado.dataNascimento,
            sexo: pacienteImportado.sexo as 'Masculino' | 'Feminino',
            especialidade: pacienteImportado.especialidade,
            dataInternacao: pacienteImportado.dataInternacao
          };

          aguardandoRegulacao.push({
            tipo: 'aguardando_regulacao',
            paciente: novoPaciente,
            motivo: 'ps_decisao'
          });
          continue;
        }

        if (isCC) {
          // Regra 2: CC - RECUPERAÇÃO logic especial
          if (pacienteExistente) {
            const leitoAnterior = encontrarLeitoAtualDoPaciente(setores, pacienteExistente.id);
            
            if (leitoAnterior && !leitoAnterior.leito.leitoPCP && 
                !leitoAnterior.setor.nomeSetor.includes('UTI')) {
              // Retornar ao leito de origem
              movimentacoes.push({
                tipo: 'movimentacao',
                pacienteId: pacienteExistente.id,
                nomePaciente: pacienteExistente.nomePaciente,
                leitoOrigemId: leitoAnterior.leito.id,
                leitoDestinoId: destinoInfo.leito.id,
                setorOrigemId: leitoAnterior.setor.id!,
                setorDestinoId: destinoInfo.setor.id!
              });
            } else {
              // Aguardar regulação
              aguardandoRegulacao.push({
                tipo: 'aguardando_regulacao',
                paciente: pacienteExistente,
                motivo: 'cc_recuperacao'
              });
            }
          }
          continue;
        }

        if (!pacienteExistente) {
          // Nova admissão
          const novoPaciente: Paciente = {
            id: crypto.randomUUID(),
            nomePaciente: pacienteImportado.nomePaciente,
            nomeNormalizado,
            dataNascimento: pacienteImportado.dataNascimento,
            sexo: pacienteImportado.sexo as 'Masculino' | 'Feminino',
            especialidade: pacienteImportado.especialidade,
            dataInternacao: pacienteImportado.dataInternacao,
            setorAtual: destinoInfo.setor.nomeSetor,
            leitoAtual: destinoInfo.leito.codigoLeito
          };

          novasAdmissoes.push({
            tipo: 'nova_admissao',
            paciente: novoPaciente,
            setorId: destinoInfo.setor.id!,
            leitoId: destinoInfo.leito.id
          });
        } else {
          // Verificar se mudou de leito
          const localizacaoAtual = encontrarLeitoAtualDoPaciente(setores, pacienteExistente.id);
          
          if (!localizacaoAtual || 
              localizacaoAtual.leito.id !== destinoInfo.leito.id) {
            // Movimentação
            movimentacoes.push({
              tipo: 'movimentacao',
              pacienteId: pacienteExistente.id,
              nomePaciente: pacienteExistente.nomePaciente,
              leitoOrigemId: localizacaoAtual?.leito.id || '',
              leitoDestinoId: destinoInfo.leito.id,
              setorOrigemId: localizacaoAtual?.setor.id || '',
              setorDestinoId: destinoInfo.setor.id!
            });
          }
          // Se está no mesmo leito, nenhuma ação necessária (Regra 3)
        }
      }

      // Verificar pacientes ausentes (Regra 5)
      const pacientesNaPlanilha = dadosImportados.map(p => normalizarNome(p.nomePaciente));
      
      for (const pacienteExistente of pacientesExistentes) {
        if (!pacientesNaPlanilha.includes(pacienteExistente.nomeNormalizado)) {
          const localizacaoAtual = encontrarLeitoAtualDoPaciente(setores, pacienteExistente.id);
          
          if (localizacaoAtual) {
            pendenciasAlta.push({
              tipo: 'pendencia_alta',
              pacienteId: pacienteExistente.id,
              nomePaciente: pacienteExistente.nomePaciente,
              setorAtual: localizacaoAtual.setor.nomeSetor,
              leitoAtual: localizacaoAtual.leito.codigoLeito
            });
          }
        }
      }

      const plano: PlanoDeMudancas = {
        novasAdmissoes,
        movimentacoes,
        aguardandoRegulacao,
        pendenciasAlta,
        totalAcoes: novasAdmissoes.length + movimentacoes.length + aguardandoRegulacao.length + pendenciasAlta.length
      };

      console.log('Plano de mudanças gerado:', plano);
      setPlanoDeMudancas(plano);
      return plano;

    } catch (error) {
      console.error('Erro na reconciliação:', error);
      toast({
        title: 'Erro na Reconciliação',
        description: 'Ocorreu um erro ao processar os dados do censo.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const encontrarLeitoAtualDoPaciente = (setores: Setor[], pacienteId: string) => {
    for (const setor of setores) {
      for (const leito of setor.leitos) {
        if (leito.pacienteId === pacienteId) {
          return { setor, leito };
        }
      }
    }
    return null;
  };

  const executarPlanoDeMudancas = async (plano: PlanoDeMudancas) => {
    try {
      setLoading(true);
      console.log('Executando plano de mudanças...');

      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      // Buscar o estado atual dos setores para poder modificá-los
      const setoresSnapshot = await getDocs(collection(db, 'setoresRegulaFacil'));
      const setoresAtuais = setoresSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Setor[];

      // Executar novas admissões
      for (const admissao of plano.novasAdmissoes) {
        console.log(`Nova admissão: ${admissao.paciente.nomePaciente} -> Leito ${admissao.leitoId}`);
        
        // Criar paciente
        const pacienteRef = doc(collection(db, 'pacientesRegulaFacil'), admissao.paciente.id);
        batch.set(pacienteRef, admissao.paciente);

        // Encontrar e atualizar o setor com o leito ocupado
        const setorParaAtualizar = setoresAtuais.find(s => s.id === admissao.setorId);
        if (setorParaAtualizar) {
          const novosLeitos = setorParaAtualizar.leitos.map(leito => {
            if (leito.id === admissao.leitoId) {
              return {
                ...leito,
                pacienteId: admissao.paciente.id,
                historicoStatus: [
                  ...(leito.historicoStatus || []), // Correção defensiva aqui!
                  {
                    status: 'Ocupado' as const,
                    timestamp,
                    pacienteId: admissao.paciente.id,
                  }
                ]
              };
            }
            return leito;
          });

          const setorRef = doc(db, 'setoresRegulaFacil', setorParaAtualizar.id!);
          batch.update(setorRef, { leitos: novosLeitos });
        }
      }

      // Executar movimentações
      for (const movimentacao of plano.movimentacoes) {
        console.log(`Movimentação: ${movimentacao.nomePaciente} de ${movimentacao.leitoOrigemId} para ${movimentacao.leitoDestinoId}`);
        
        // Liberar leito de origem
        if (movimentacao.leitoOrigemId) {
          const setorOrigem = setoresAtuais.find(s => s.id === movimentacao.setorOrigemId);
          if (setorOrigem) {
            const leitosOrigemAtualizados = setorOrigem.leitos.map(leito => {
              if (leito.id === movimentacao.leitoOrigemId) {
                return {
                  ...leito,
                  pacienteId: null,
                  historicoStatus: [
                    ...(leito.historicoStatus || []), // Correção defensiva aqui!
                    {
                      status: 'Vago' as const,
                      timestamp,
                      pacienteId: null,
                    }
                  ]
                };
              }
              return leito;
            });

            const setorOrigemRef = doc(db, 'setoresRegulaFacil', setorOrigem.id!);
            batch.update(setorOrigemRef, { leitos: leitosOrigemAtualizados });
          }
        }

        // Ocupar leito de destino
        const setorDestino = setoresAtuais.find(s => s.id === movimentacao.setorDestinoId);
        if (setorDestino) {
          const leitosDestinoAtualizados = setorDestino.leitos.map(leito => {
            if (leito.id === movimentacao.leitoDestinoId) {
              return {
                ...leito,
                pacienteId: movimentacao.pacienteId,
                historicoStatus: [
                  ...(leito.historicoStatus || []), // Correção defensiva aqui!
                  {
                    status: 'Ocupado' as const,
                    timestamp,
                    pacienteId: movimentacao.pacienteId,
                  }
                ]
              };
            }
            return leito;
          });

          const setorDestinoRef = doc(db, 'setoresRegulaFacil', setorDestino.id!);
          batch.update(setorDestinoRef, { leitos: leitosDestinoAtualizados });
        }
      }

      await batch.commit();

      toast({
        title: 'Reconciliação Concluída',
        description: `${plano.totalAcoes} ações executadas com sucesso!`,
      });

      setPlanoDeMudancas(null);

    } catch (error) {
      console.error('Erro ao executar plano de mudanças:', error);
      toast({
        title: 'Erro na Execução',
        description: 'Ocorreu um erro ao aplicar as mudanças.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    planoDeMudancas,
    reconciliarCenso,
    executarPlanoDeMudancas,
    setPlanoDeMudancas
  };
};
