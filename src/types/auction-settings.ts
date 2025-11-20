export type BudgetType = 'SALARY_CAP' | 'FAAB';

export interface ContractRule {
  minBid: number;    // Valor mínimo do lance para aplicar esta regra
  maxBid?: number;   // Valor máximo (opcional, se for o último tier é infinito)
  years: number;     // Duração do contrato gerado
}

export interface RosterSettings {
  maxRosterSize: number;
  positions?: Record<string, number>; // Ex: { "QB": 2, "RB": 4 }
}

export interface AuctionSettings {
  budgetType: BudgetType;
  startingBudget: number;
  
  // Lógica de Contratos Dinâmicos
  contractLogic: {
    enabled: boolean;
    rules: ContractRule[];
  };
  
  roster: RosterSettings;
  
  // Regras de Lance
  minIncrement: number; // Ex: 1 ($) ou porcentagem
  timerSeconds: number; // Tempo do relógio de leilão
}

// Configuração "The Bad Place" para teste
export const DEFAULT_SETTINGS: AuctionSettings = {
  budgetType: 'SALARY_CAP',
  startingBudget: 1000,
  contractLogic: {
    enabled: true,
    rules: [
      { minBid: 1, maxBid: 9, years: 1 },
      { minBid: 10, maxBid: 49, years: 2 },
      { minBid: 50, maxBid: 99, years: 3 },
      { minBid: 100, years: 4 }
    ]
  },
  roster: {
    maxRosterSize: 20
  },
  minIncrement: 1,
  timerSeconds: 30
};