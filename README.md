# RegulaFacil

![Status do Build](https://img.shields.io/badge/build-passing-brightgreen)
![Licença](https://img.shields.io/badge/license-MIT-blue)
![Versão](https://img.shields.io/badge/version-1.0.0-informational)

> Otimizando o fluxo, salvando vidas — a plataforma completa para gestão de leitos e regulação hospitalar em tempo real.

## Visão Geral

Hospitais enfrentam desafios diários como superlotação, demora na alocação de pacientes, dificuldades na higienização e falta de visibilidade do status dos leitos. O RegulaFacil oferece uma solução centralizada e inteligente que proporciona uma visão 360º da ocupação hospitalar, agiliza processos e eleva a eficiência operacional. Com o fluxo de pacientes otimizado, gestores e profissionais de saúde podem tomar decisões mais assertivas, garantindo segurança do paciente e melhor qualidade de atendimento com um software para hospitais moderno e integrado.

### Visão Geral da Plataforma
*(Opcional, mas recomendado: Adicione aqui um screenshot da dashboard principal do sistema)*

![Dashboard Principal do RegulaFacil](https://seu-link-para-a-imagem.png "Visão geral do Mapa de Leitos e indicadores do RegulaFacil")

## ✨ Principais Funcionalidades

### 🏥 Módulo Central de Regulação de Leitos

- 🗺️ **Mapa de Leitos Interativo:** Visualização em tempo real do status de todos os leitos (ocupado, vago, higienizando, bloqueado, reservado).
- 🔄 **Gestão de Remanejamentos:** Solicite e aprove transferências de pacientes entre leitos e setores com justificativas claras.
- 📋 **Pacientes Aguardando Regulação:** Listas priorizadas de pacientes esperando por um leito, com indicadores de tempo de espera.
- ✔️ **Alocação Inteligente:** Receba sugestões de leitos compatíveis com as necessidades do paciente (isolamento, especialidade, etc.).

### 🧼 Módulo de Higienização

- 🧹 **Central de Higienização:** Acompanhe o ciclo de limpeza dos leitos, desde a solicitação até a liberação.
- ⏱️ **Indicadores de Tempo:** Monitore o tempo médio de higienização e identifique gargalos.

### 🔬 Gestão de Isolamentos e Riscos

- ☣️ **Controle de Isolamentos:** Gerencie pacientes que necessitam de isolamento, garantindo a segurança contra contaminação cruzada.
- ⚠️ **Alertas de Incompatibilidade:** O sistema alerta sobre riscos ao tentar alocar pacientes em leitos inadequados.

### 🩺 Módulo Cirúrgico e Oncológico

- 🗓️ **Marcação Cirúrgica:** Organize a fila de cirurgias eletivas e gerencie as alocações de leitos no pós-operatório.
- 🎗️ **Reservas para Oncologia:** Garanta a disponibilidade de leitos para pacientes oncológicos com um sistema de reserva dedicado.

### 📊 Dashboards e Gestão Estratégica

- 📈 **Indicadores em Tempo Real:** Acompanhe taxas de ocupação, tempo médio de permanência, giro de leitos e outros KPIs.
- 🤝 **Huddle Dashboard:** Painel para reuniões rápidas de equipe (huddles) com os pontos mais críticos do dia.
- 🔍 **Auditoria Completa:** Rastreie todas as ações importantes realizadas no sistema para fins de auditoria e segurança.

### ⚙️ Administração e Configurações

- 👤 **Gestão de Usuários e Permissões:** Controle de acesso granular por função (médico, enfermeiro, administrativo, etc.).
- 📄 **Relatórios e Exportação:** Gere relatórios em PDF para passagens de plantão e análises gerenciais.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React, TypeScript, Vite
- **Estilização:** Tailwind CSS, Shadcn/UI
- **Backend & Banco de Dados:** Firebase (Firestore, Authentication)
- **Ícones:** Lucide React

## 💻 Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/regulafacil.git
   ```
2. **Navegue até o diretório:**
   ```bash
   cd regulafacil
   ```
3. **Instale as dependências:**
   ```bash
   npm install
   ```
4. **Configure as variáveis de ambiente:**
   - Crie um arquivo `.env.local` na raiz do projeto.
   - Adicione as chaves do seu projeto Firebase (siga o exemplo do `.env.example`).
5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
6. Abra `http://localhost:5173` no seu navegador.

## 🤝 Como Contribuir

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua Feature (`git checkout -b feature/AmazingFeature`).
3. Faça o **Commit** de suas mudanças (`git commit -m 'Add some AmazingFeature'`).
4. Faça o **Push** para a Branch (`git push origin feature/AmazingFeature`).
5. Abra um **Pull Request**.

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE.txt` para mais informações.
