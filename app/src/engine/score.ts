import type { GameState, Scenario } from './types';

export interface GameScore {
  valueDelivered: number;
  customerLoyalty: number;
  teamHealth: number;
  stakeholderTrust: number;
  productIntegrity: number;
  total: number;
}

export function calculateScore(state: GameState, scenario: Scenario): GameScore {
  const valueDelivered = scenario.targetRevenue
    ? Math.min(100, (state.economy.revenue / scenario.targetRevenue) * 100)
    : 0;

  const customers = Object.values(state.customers);
  const maxHappiness = customers.length * 10 || 1;
  const totalHappiness = customers.reduce((s, c) => s + c.happiness, 0);
  const customerLoyalty = (totalHappiness / maxHappiness) * 100;

  const teamHealth = (state.team.morale / 10) * 100;

  const stakeholders = Object.values(state.stakeholders);
  const maxTrust = stakeholders.length * 10 || 1;
  const totalTrust = stakeholders.reduce((s, x) => s + x.trust, 0);
  const stakeholderTrust = (totalTrust / maxTrust) * 100;

  const productIntegrity = Math.max(0, 100 - state.tech.techDebt);

  const total =
    (valueDelivered + customerLoyalty + teamHealth + stakeholderTrust + productIntegrity) / 5;

  return {
    valueDelivered: round(valueDelivered),
    customerLoyalty: round(customerLoyalty),
    teamHealth: round(teamHealth),
    stakeholderTrust: round(stakeholderTrust),
    productIntegrity: round(productIntegrity),
    total: round(total),
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
