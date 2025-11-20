export type BudgetType = 'SALARY_CAP' | 'FAAB';

export interface ContractRule {
  minBid: number;    // valor minimo do lance para aplicar esta regra
  maxBid?: number;   // valor maximo (opcional, se for o ultimo tier acima eh infinito)
  years: number;     // duracao do contrato gerado
}

export interface RosterSettings {
  maxRosterSize: number;
  positions?: Record<string, number>; // ex: { "QB": 2, "RB": 4 }
}

export interface AuctionSettings {
  budgetType: BudgetType;
  startingBudget: number;
  
  // Logica de contratos dinamicos
  contractLogic: {
    enabled: boolean;
    rules: ContractRule[];
  };
  
  roster: RosterSettings;
  
  // Regras de lance
  minIncrement: number; // ex: 1 ($) ou porcentagem
  timerSeconds: number; // tempo do relogio de leilao
}

// Configuracao "The Bad Place" para teste
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
