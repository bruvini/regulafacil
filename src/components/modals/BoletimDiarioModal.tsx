import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useBoletimDiario } from '@/hooks/useBoletimDiario';
import { toast } from 'sonner';

interface BoletimDiarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoletimDiarioModal = ({ isOpen, onClose }: BoletimDiarioModalProps) => {
  const { gerarBoletim, leitos } = useBoletimDiario();
  const [dadosManuais, setDadosManuais] = useState({
    observadosDCL: 0,
    observadosDCX: 0,
    observadosNeurologicos: 0,
    observadosSalaLaranja: 0,
    observadosSalaEmergencia: 0,
    salasAtivasCC: 0,
    salasBloqueadasCC: 0,
    salasTravadasCC: 0
  });

  useEffect(() => {
    setDadosManuais({
      observadosDCL: 0,
      observadosDCX: 0,
      observadosNeurologicos: 0,
      observadosSalaLaranja: 0,
      observadosSalaEmergencia: 0,
      salasAtivasCC: 0,
      salasBloqueadasCC: 0,
      salasTravadasCC: 0
    });
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDadosManuais(prevState => ({
      ...prevState,
      [name]: parseInt(value, 10) || 0
    }));
  };

  const handleGerarBoletim = async () => {
    try {
      await gerarBoletim({
        observadosDCL: dadosManuais.observadosDCL || 0,
        observadosDCX: dadosManuais.observadosDCX || 0,
        observadosNeurologicos: dadosManuais.observadosNeurologicos || 0,
        observadosSalaLaranja: dadosManuais.observadosSalaLaranja || 0,
        observadosSalaEmergencia: dadosManuais.observadosSalaEmergencia || 0,
        salasAtivasCC: dadosManuais.salasAtivasCC || 0,
        salasBloqueadasCC: dadosManuais.salasBloqueadasCC || 0,
        salasTravadasCC: dadosManuais.salasTravadasCC || 0
      });
      toast.success('Boletim diário gerado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao gerar boletim:', error);
      toast.error('Erro ao gerar boletim diário');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerar Boletim Diário</DialogTitle>
          <DialogDescription>
            Informe os dados para gerar o boletim diário.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observadosDCL" className="text-right">
              Observados DCL
            </Label>
            <Input
              type="number"
              id="observadosDCL"
              name="observadosDCL"
              value={dadosManuais.observadosDCL}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observadosDCX" className="text-right">
              Observados DCX
            </Label>
            <Input
              type="number"
              id="observadosDCX"
              name="observadosDCX"
              value={dadosManuais.observadosDCX}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observadosNeurologicos" className="text-right">
              Observados Neurológicos
            </Label>
            <Input
              type="number"
              id="observadosNeurologicos"
              name="observadosNeurologicos"
              value={dadosManuais.observadosNeurologicos}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observadosSalaLaranja" className="text-right">
              Observados Sala Laranja
            </Label>
            <Input
              type="number"
              id="observadosSalaLaranja"
              name="observadosSalaLaranja"
              value={dadosManuais.observadosSalaLaranja}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="observadosSalaEmergencia" className="text-right">
              Observados Sala Emergência
            </Label>
            <Input
              type="number"
              id="observadosSalaEmergencia"
              name="observadosSalaEmergencia"
              value={dadosManuais.observadosSalaEmergencia}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salasAtivasCC" className="text-right">
              Salas Ativas CC
            </Label>
            <Input
              type="number"
              id="salasAtivasCC"
              name="salasAtivasCC"
              value={dadosManuais.salasAtivasCC}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salasBloqueadasCC" className="text-right">
              Salas Bloqueadas CC
            </Label>
            <Input
              type="number"
              id="salasBloqueadasCC"
              name="salasBloqueadasCC"
              value={dadosManuais.salasBloqueadasCC}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salasTravadasCC" className="text-right">
              Salas Travadas CC
            </Label>
            <Input
              type="number"
              id="salasTravadasCC"
              name="salasTravadasCC"
              value={dadosManuais.salasTravadasCC}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleGerarBoletim}>Gerar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
