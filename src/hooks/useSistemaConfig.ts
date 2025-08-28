
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface SistemaConfig {
  modoManutencaoAtivo: boolean;
  senhaManutencao: string;
}

export const useSistemaConfig = () => {
  const [config, setConfig] = useState<SistemaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const configRef = doc(db, 'configuracoes', 'sistema');
    
    const unsubscribe = onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        setConfig(doc.data() as SistemaConfig);
      } else {
        // Se o documento não existe, criar com valores padrão
        setConfig({
          modoManutencaoAtivo: false,
          senhaManutencao: 'RegulaFacil#MNT2025!'
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Erro ao escutar configurações do sistema:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleModoManutencao = async (senhaFornecida: string): Promise<boolean> => {
    if (!config) return false;

    if (senhaFornecida !== config.senhaManutencao) {
      toast({
        title: "Senha incorreta",
        description: "A senha fornecida não está correta.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const configRef = doc(db, 'configuracoes', 'sistema');
      await updateDoc(configRef, {
        modoManutencaoAtivo: !config.modoManutencaoAtivo
      });

      toast({
        title: "Status alterado",
        description: `Modo de manutenção ${!config.modoManutencaoAtivo ? 'ativado' : 'desativado'} com sucesso.`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao alterar modo de manutenção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status de manutenção.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    modoManutencaoAtivo: config?.modoManutencaoAtivo || false,
    loading,
    toggleModoManutencao
  };
};
