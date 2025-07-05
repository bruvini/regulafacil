
import { useMemo } from 'react';
import { useSetores } from './useSetores';
import { Leito, DadosPaciente } from '@/types/hospital';

// Função para calcular idade, já que a usaremos aqui
const calcularIdade = (dataNascimento: string): number => {
  if (!dataNascimento || !/^\d{2}\/\d{2}\/\d{4}$/.test(dataNascimento)) return 999;
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const nascimento = new Date(ano, mes - 1, dia);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

export const useLeitoFinder = () => {
  const { setores } = useSetores();

  const findAvailableLeitos = (paciente: DadosPaciente) => {
    if (!paciente) return [];

    const todosLeitosComSetor = setores.flatMap(setor => 
        setor.leitos.map(leito => ({ ...leito, setorNome: setor.nomeSetor, setorId: setor.id }))
    );

    const setoresExcluidos = [
      "UTI", "CC - PRE OPERATORIO", "CC - RECUPERAÇÃO", "CC - SALAS CIRURGICAS",
      "PS DECISÃO CIRURGICA", "PS DECISÃO CLINICA", "SALA LARANJA", 
      "UNID. AVC AGUDO", "UNID. DE AVC - INTEGRAL"
    ];

    const leitosDisponiveis = todosLeitosComSetor.filter(leito => {
      // 1. Filtro Básico: Só leitos vagos ou em higienização
      if (!['Vago', 'Higienizacao'].includes(leito.statusLeito)) return false;
      
      // 2. Filtro de Setor Excluído
      if (setoresExcluidos.includes(leito.setorNome)) return false;

      const isolamentosPaciente = paciente.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';

      // 3. Filtro de Isolamento
      if (isolamentosPaciente) {
        if (!leito.leitoIsolamento) {
          // Se o leito não é de isolamento, checa se é um quarto compatível
          const quarto = leito.codigoLeito.split(' ')[0];
          const companheiros = todosLeitosComSetor.filter(
            l => l.codigoLeito.startsWith(quarto) && l.id !== leito.id && l.statusLeito === 'Ocupado'
          );
          if (companheiros.length > 0) {
            const todosCompativeis = companheiros.every(c => {
              const isoCompanheiro = c.dadosPaciente?.isolamentosVigentes?.map(i => i.sigla).sort().join(',') || '';
              return isoCompanheiro === isolamentosPaciente;
            });
            if (!todosCompativeis) return false;
          }
        }
      }

      // 4. Filtro de Sexo em Quartos Ocupados
      const quarto = leito.codigoLeito.split(' ')[0];
      const companheiros = todosLeitosComSetor.filter(
        l => l.codigoLeito.startsWith(quarto) && l.id !== leito.id && l.statusLeito === 'Ocupado'
      );
      if (companheiros.length > 0) {
        const todosMesmoSexo = companheiros.every(c => c.dadosPaciente?.sexoPaciente === paciente.sexoPaciente);
        if (!todosMesmoSexo) return false;
      }

      // 5. Filtro de Leito PCP
      if (leito.leitoPCP) {
          const idade = calcularIdade(paciente.dataNascimento);
          if (idade < 18 || idade > 60 || isolamentosPaciente) {
              return false;
          }
      }

      return true; // Se passou por todas as regras, o leito está disponível
    });

    return leitosDisponiveis;
  };

  return { findAvailableLeitos };
};
