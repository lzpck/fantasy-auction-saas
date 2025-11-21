export type BudgetType = 'SALARY_CAP' | 'FAAB';

// Tipos de duração de contrato
export type ContractDurationType = 'any' | 'min-2' | 'min-3' | 'min-4' | 'fixed';

export interface ContractRule {
  minBid: number;           // valor minimo do lance para aplicar esta regra
  maxBid?: number;          // valor maximo (opcional, se for o ultimo tier acima eh infinito)
  durationType: ContractDurationType;  // tipo de duração: any (qualquer), min-X (mínimo X anos), fixed (fixo)
  years?: number;           // anos fixos (usado quando durationType é 'fixed')
  minYears?: number;        // anos mínimos (usado quando durationType é 'min-X')
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
      { minBid: 1, maxBid: 9, durationType: 'any', minYears: 1 },
      { minBid: 10, maxBid: 49, durationType: 'min-2', minYears: 2 },
      { minBid: 50, maxBid: 99, durationType: 'min-3', minYears: 3 },
      { minBid: 100, durationType: 'min-4', minYears: 4 }
    ]
  },
  roster: {
    maxRosterSize: 20
  },
  minIncrement: 1,
  timerSeconds: 30
};

// Função auxiliar para obter o rótulo de uma regra de contrato
export function getContractDurationLabel(durationType: ContractDurationType, years?: number, minYears?: number): string {
  switch (durationType) {
    case 'any':
      return 'Qualquer duração';
    case 'min-2':
      return 'Mínimo de 2 anos';
    case 'min-3':
      return 'Mínimo de 3 anos';
    case 'min-4':
      return 'Mínimo de 4 anos';
    case 'fixed':
      return `${years} ano${years !== 1 ? 's' : ''} (fixo)`;
    default:
      return 'Desconhecido';
  }
}

// Função auxiliar para validar anos de contrato com base na regra
export function validateContractYears(rule: ContractRule, proposedYears: number): { valid: boolean; message?: string } {
  switch (rule.durationType) {
    case 'any':
      return { valid: proposedYears >= 1 };
    case 'min-2':
      return {
        valid: proposedYears >= 2,
        message: proposedYears < 2 ? 'O contrato deve ter no mínimo 2 anos' : undefined
      };
    case 'min-3':
      return {
        valid: proposedYears >= 3,
        message: proposedYears < 3 ? 'O contrato deve ter no mínimo 3 anos' : undefined
      };
    case 'min-4':
      return {
        valid: proposedYears >= 4,
        message: proposedYears < 4 ? 'O contrato deve ter no mínimo 4 anos' : undefined
      };
    case 'fixed':
      return {
        valid: proposedYears === rule.years,
        message: proposedYears !== rule.years ? `O contrato deve ter exatamente ${rule.years} ano${rule.years !== 1 ? 's' : ''}` : undefined
      };
    default:
      return { valid: false, message: 'Tipo de duração desconhecido' };
  }
}
