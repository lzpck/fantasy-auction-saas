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

  // Duração máxima de contratos que podem ser estabelecidos
  maxContractYears: number;

  roster: RosterSettings;

  // Regras de lance
  minIncrement: number; // ex: 1 ($) ou porcentagem
  timerSeconds: number; // tempo do relogio de leilao
}

// Configuracao "The Bad Place" para teste
// Valores em escala de milhões (1M = 1000000)
export const DEFAULT_SETTINGS: AuctionSettings = {
  budgetType: 'SALARY_CAP',
  startingBudget: 200000000, // 200M
  contractLogic: {
    enabled: true,
    rules: [
      { minBid: 1000000, maxBid: 9000000, durationType: 'any', minYears: 1 },        // 1M - 9M
      { minBid: 10000000, maxBid: 49000000, durationType: 'min-2', minYears: 2 },    // 10M - 49M
      { minBid: 50000000, maxBid: 99000000, durationType: 'min-3', minYears: 3 },    // 50M - 99M
      { minBid: 100000000, durationType: 'min-4', minYears: 4 }                      // 100M+
    ]
  },
  maxContractYears: 4, // Duração máxima padrão para contratos
  roster: {
    maxRosterSize: 20
  },
  minIncrement: 1000000, // 1M
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
export function validateContractYears(rule: ContractRule, proposedYears: number, maxContractYears?: number): { valid: boolean; message?: string } {
  // Validação do limite máximo de anos (se definido)
  if (maxContractYears && proposedYears > maxContractYears) {
    return {
      valid: false,
      message: `O contrato não pode exceder ${maxContractYears} ano${maxContractYears !== 1 ? 's' : ''}`
    };
  }

  // Validação baseada no tipo de regra
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
