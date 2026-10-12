# Manual de Integração e Fluxo Operacional: Da Simulação de Crédito ao Módulo Financeiro

Este documento estabelece o fluxo oficial de ponta a ponta (End-to-End) da plataforma **AgroTech**, conectando:
1. **CRM & Cadastro Rural** (Produtor, Propriedade e Lastro Patrimonial);
2. **Central de Limite de Crédito & Risco MCR** (Capacidade de Pagamento, ICSD e LTV);
3. **Projetos de Crédito Rural** (Dossiês Custeio, RenovAgro, InovAgro, Laudos);
4. **Demandas & Ordens de Serviço** (Esteira Operacional, Checklist Documental e SLA);
5. **Módulo Financeiro Integrado** (Honorários, Contas a Receber, Comissões de Parceiros, Contas a Pagar, Livro-Caixa e DRE).

---

## 1. Visão Geral da Arquitetura de Dados Integrada

O sistema opera sobre um modelo de dados relacional unificado no PostgreSQL gerenciado pelo Prisma:

```
[Produtor & Propriedade (CRM)]
        │
        ├──► [Central de Limite de Crédito (MCR)]
        │         │ (Calcula CP, ICSD >= 1.20 e LTV de Garantias)
        │         ▼
        ├──► [Projeto de Crédito / Dossiê (GED)]
        │         │ (Compilação PDF com Hash SHA-256 e Valor Financiado)
        │         ▼
        └──► [Demanda / Ordem de Serviço Rural]
                  │ (Controle de SLA, Checklist de Documentos e Responsável)
                  │
                  ▼ (Ao transicionar para status 'CONCLUIDO')
            [Gatilho Automático Financeiro (triggerReceivableFromDemand)]
                  ├──► [Título a Receber (ReceivableTitle)]
                  │         ├── Parcelas a Receber (ReceivableInstallment)
                  │         └── Comissão Provisionada Bloqueada (PartnerCommission)
                  │
                  ├──► [Custos do Projeto (PayableTitle)]
                  │         └── Taxas ART, Combustível, Vistorias e Laudos
                  │
                  ▼ (Baixa/Liquidação com Recibo QuittanceReceipt)
            [Livro-Caixa (CashTransaction) & Saldo Bancário (BankAccount)]
                  └──► Liberação Automática da Comissão do Parceiro
```

---

## 2. A Jornada do Usuário Passo a Passo (User Workflow)

### Etapa 1: Qualificação e Lastro Patrimonial no CRM
- **Atores:** Operador Técnico, Cadastrador ou Agrônomo.
- **Rota:** `/admin/crm/properties/[id]/edit`
- **Ações:**
  1. No **Passo 1 (Dados Fundiários):** Cadastra Matrícula, CAR Federal homologado pelo SICAR, CCIR, ITR/CIB e áreas (total, consolidada, pastagem, reserva, VTN).
  2. No **Passo 2 (Máquinas & Veículos):** Registra tratores, colheitadeiras e implementos com valores de mercado e estado de conservação (base de penhor).
  3. No **Passo 3 (Benfeitorias & Rebanho):** Registra cercas, currais, barracões, pastagem artificial e contagem de rebanho com categorias BB (matrizes, novilhas, bezerros).
  4. No **Passo 4 (Resumo Financeiro):** Informa receitas agropecuárias históricas e projetadas, outras receitas e despesas operacionais e familiares.
  5. **Transição Direta:** Ao clicar em **"Salvar e Abrir Simulação"**, o sistema valida rigorosamente a integridade dos dados e transiciona o usuário para a Central de Limite de Crédito.

---

### Etapa 2: Simulação de Risco & Limite de Crédito (MCR)
- **Atores:** Analista de Crédito Rural / Responsável Técnico.
- **Rota:** `/admin/credit-limit?propertyId=[id]&tab=simulator`
- **Ações:**
  1. Seleciona a **Linha de Financiamento** pretendida (ex: *PRONAMP Custeio*, *RenovAgro*, *InovAgro*, *Moderfrota*, *FCO*).
  2. Informa o **Valor Pretendido**, **Taxa de Juros Anual**, **Prazo em Meses**, **Carência** e **Sistema de Amortização** (*Price* ou *SAC*).
  3. O **Motor Matemático MCR** processa em tempo real no servidor:
     - **Capacidade de Pagamento Líquida (CP):** `Inflows Líquidos - Despesas Familiares e Dívidas Preexistentes`.
     - **Serviço da Dívida Anual (SD):** Parcela calculada pelo sistema Price/SAC.
     - **Índice de Cobertura do Serviço da Dívida (ICSD):** `CP / SD`. Exige `ICSD >= 1.20` para parecer aprovável.
     - **Garantias & LTV Ponderado:** Ponderação de lastro (Terra 100%, Benfeitorias 70-80%, Máquinas 50-70%, Semoventes 60%, Bens Urbanos e Frotas).
  4. Clica em **"Salvar Análise de Crédito"**:
     - Persiste o registro em `credit_analyses` com hash criptográfico SHA-256 e status (`APROVADO`, `EM_ANALISE`, `RESSALVAS`).

---

### Etapa 3: Abertura da Demanda / Ordem de Serviço Rural
- **Atores:** Coordenador Técnico / Gerente da Filial.
- **Rota:** `/admin/demands`
- **Ações:**
  1. Cria uma nova Demanda Rural vinculando o **Produtor**, a **Propriedade** e o **Tipo de Serviço** (ex: `PROJETO_CUSTEIO`, `PROJETO_INVESTIMENTO` ou `LIMITE_CREDITO`).
  2. Define o **Responsável Técnico**, prioridade (`ALTA`, `URGENTE`) e a **Data Estimada de Entrega (SLA)**.
  3. O sistema cria automaticamente o **Checklist Documental** do serviço:
     - Matrícula Atualizada com Ônus Reais;
     - Recibo do CAR Federal;
     - CCIR e Certidão Negativa de ITR;
     - Ficha de Limite de Crédito / Análise MCR;
     - Anotação de Responsabilidade Técnica (ART).
  4. A demanda entra em `SOLICITADO` e avança para `EM_EXECUCAO` conforme a equipe técnica colhe laudos e documentos.

---

### Etapa 4: Elaboração e Emissão do Projeto de Crédito
- **Atores:** Responsável Técnico (Agrônomo / Consultor).
- **Rota:** `/admin/documents/credit-projects/new`
- **Ações:**
  1. Seleciona o Produtor e o Imóvel Rural (os dados de matrícula, CAR, rebanho e máquinas são pré-carregados automaticamente).
  2. Escolhe o **Template Oficial Bancário** (ex: *Projeto Técnico Custeio Safra BB/Sicredi*, *Projeto RenovAgro*, *Projeto InovAgro*).
  3. Preenche os dados agronômicos específicos: cronograma de aplicação de recursos, custo por hectare, plano de rotação e ART do CREA.
  4. Clica em **"Emitir Documento Oficial"**:
     - O sistema compila o PDF com alta fidelidade visual (A4, vetorial, sem distorções);
     - Calcula o **Hash SHA-256** de integridade antifraude;
     - Salva o registro em `generated_forms` e armazena o arquivo no GED;
     - Realiza o download automático para o operador protocolar na agência bancária proponente.

---

### Etapa 5: Conclusão da Demanda e Faturamento Automático (Contas a Receber)
- **Atores:** Gerente de Operações / Responsável Técnico.
- **Mecanismo:** Automação via Server Action (`updateDemandStatus` -> `triggerReceivableFromDemand`).
- **Ações:**
  1. Na esteira de demandas (`/admin/demands`), o operador conclui todas as tarefas do checklist e altera o status para **`CONCLUIDO`**.
  2. O sistema dispara instantaneamente o gatilho financeiro:
     - Cria o **Título a Receber (`ReceivableTitle`)** com código sequencial (ex: `FAT-2026-0001`).
     - Herda automaticamente Produtor, Propriedade, Filial e ID da Demanda.
     - **Cálculo dos Honorários:**
       $$\text{Valor Bruto} = (\text{Valor Financiado} \times \% \text{ Êxito}) + \text{Honorário Fixo}$$
       *(Onde `% de Êxito` e `Fixo` respeitam as configurações da Organização, ex: 2% de sucesso).*
     - Cria a parcela inicial com vencimento padrão para 30 dias (ou safra).
     - **Provisão de Comissão de Parceiro:** Se a demanda/produtor teve indicação de um Parceiro Comercial cadastrado (ex: revenda agrícola ou consultor parceiro), o sistema provisiona a comissão (`PartnerCommission`) com **Status `BLOQUEADO`**.

---

### Etapa 6: Apropriação de Despesas do Projeto (Contas a Pagar)
- **Atores:** Assistente Financeiro / Operador Técnico.
- **Rota:** `/admin/financial/payables`
- **Ações:**
  1. O usuário registra as despesas diretas incorridas na elaboração do projeto:
     - Taxa de ART no CREA (`DESPESA_PROJETO`);
     - Combustível e diária de vistoria técnica presencial;
     - Emissão de certidões cartorárias e mapas topográficos.
  2. Ao lançar a despesa, seleciona a **Demanda** correspondente no campo `demandId`.
  3. Isso permite apurar o **Custo Real do Projeto** e o lucro líquido por cliente/dossiê.

---

### Etapa 7: Baixa, Liquidação e Efeito no Livro-Caixa e DRE
- **Atores:** Gestor Financeiro.
- **Rota:** `/admin/financial/receivables` e `/admin/financial`
- **Ações:**
  1. Quando o banco libera o recurso e o produtor paga os honorários:
     - O operador acessa o Contas a Receber e clica em **"Dar Baixa / Liquidar"**.
     - Seleciona a **Conta Bancária / Caixa** de destino (ex: *Banco do Brasil - Conta Movimento*), forma de pagamento (PIX, TED, Boleto) e anexa o comprovante.
     - O sistema:
       * Atualiza o status do título para `RECEBIDO`;
       * Emite o **Recibo de Quitação (`QuittanceReceipt`)** numerado;
       * Debita/credita o saldo em `BankAccount.currentBalance`;
       * Registra a transação no **Livro-Caixa (`CashTransaction`)**;
       * **Destrava a Comissão do Parceiro:** Altera o status da `PartnerCommission` de `BLOQUEADO` para `LIBERADO`, gerando a autorização de pagamento no Contas a Pagar.
  2. **DRE & Dashboard Executivo:**
     - A página principal do Financeiro (`/admin/financial`) recalcula instantaneamente os gráficos de DRE, fluxo de caixa mensal, margem operacional da filial e evolução de metas.

---

## 3. Matriz de Entidades e Relacionamentos no Banco de Dados

| Entidade Prisma | Módulo | Função no Ciclo |
|---|---|---|
| `Producer` / `Property` | CRM | Base jurídica, dados de matrículas, CAR Federal, VTN e rebanho. |
| `CreditAnalysis` | Crédito / MCR | Simulação bancária oficial, cálculo do ICSD, capacidade de pagamento e LTV. |
| `GeneratedForm` | Projetos / GED | Dossiê de crédito emitido, versão do template, payload e hash SHA-256. |
| `ServiceDemand` | Operações | Ordem de serviço com controle de SLA, checklist, responsável e status kanban. |
| `ReceivableTitle` | Financeiro | Título de cobrança de honorários de crédito (êxito + fixo). |
| `ReceivableInstallment` | Financeiro | Parcelas de recebimento com data de vencimento e controle de atraso. |
| `PartnerCommission` | Financeiro | Provisão com trava de segurança para comissão de parceiros comerciais. |
| `PayableTitle` | Financeiro | Contas a pagar da filial e custos diretos dos projetos (ART, combustível, laudos). |
| `CashTransaction` | Financeiro | Livro-caixa real para conciliação bancária e apuração do DRE. |
| `BankAccount` | Financeiro | Contas correntes e aplicações com saldo sincronizado em tempo real. |

---

## 4. Configurações Recomendadas para o Administrador

Para que o módulo financeiro opere com 100% de automação:

1. **Plano de Contas (`FinancialCategory`):**
   - Receitas: `1.1.01 - Honorários de Projetos de Crédito Rural` (Categoria primária do gatilho).
   - Receitas: `1.1.02 - Laudos de Avaliação e Perícias`.
   - Despesas: `2.1.01 - Taxas de ART / CREA`.
   - Despesas: `2.1.02 - Combustível e Vistorias de Campo`.
   - Despesas: `2.2.01 - Comissões de Parceiros Comerciais`.
2. **Parâmetros da Organização (`FinancialSettings`):**
   - `defaultSuccessFeePercent`: Percentual padrão de êxito sobre o crédito (ex: `2.00%` a `3.00%`).
   - `defaultPartnerCommissionPercent`: Percentual de repasse sobre os honorários para parceiros (ex: `20.00%`).
3. **Contas Bancárias (`BankAccount`):**
   - Cadastrar as contas ativas de cada filial para direcionamento das liquidações e controle de saldo.
