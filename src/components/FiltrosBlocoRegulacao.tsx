
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltrosRegulacao } from "@/components/FiltrosRegulacao";

interface FiltrosBlocoRegulacaoProps {
  filtrosProps: {
    filtrosAvancados: any;
    setFiltrosAvancados: (filtros: any) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    resetFiltros: () => void;
    sortConfig: { key: string; direction: string };
    setSortConfig: (config: { key: string; direction: string }) => void;
  };
}

export const FiltrosBlocoRegulacao = ({ filtrosProps }: FiltrosBlocoRegulacaoProps) => {
  return (
    <Card className="shadow-card border border-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-medical-primary">
          Filtros e Ordenação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FiltrosRegulacao
          filtrosAvancados={filtrosProps.filtrosAvancados}
          setFiltrosAvancados={filtrosProps.setFiltrosAvancados}
          searchTerm={filtrosProps.searchTerm}
          setSearchTerm={filtrosProps.setSearchTerm}
          resetFiltros={filtrosProps.resetFiltros}
          sortConfig={filtrosProps.sortConfig}
          setSortConfig={filtrosProps.setSortConfig}
        />
      </CardContent>
    </Card>
  );
};
