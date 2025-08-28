
import React from 'react';

const MaintenancePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl w-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden md:flex">
        <div className="md:w-1/2">
          <img 
            src="/lovable-uploads/1d1ac5a0-de2d-4fde-8112-7e2d30a5435e.png" 
            alt="Equipe trabalhando em uma sala de controle" 
            className="object-cover h-64 w-full md:h-full"
          />
        </div>
        <div className="p-8 md:w-1/2 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-medical-primary mb-4">
            Uma pausa para evoluir.
          </h1>
          <p className="text-lg text-gray-300 mb-6">
            O RegulaFacil está passando por uma manutenção programada para ficar ainda mais poderoso e confiável.
          </p>
          <p className="text-sm text-gray-400">
            O enfermeiro Bruno está pessoalmente calibrando cada detalhe para otimizar o fluxo de cuidados e garantir que a nossa missão de salvar vidas seja cumprida com a máxima eficiência.
          </p>
          <p className="text-xs text-gray-500 mt-8">
            Agradecemos a sua paciência. Voltaremos em breve.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            &copy; 2025 RegulaFacil. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
