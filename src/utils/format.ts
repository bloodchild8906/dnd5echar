import { CurrencyWallet, ItemValue } from '../domain/models';

export const formatModifier = (value: number): string => `${value >= 0 ? '+' : ''}${value}`;

export const formatCurrencyValue = (value: ItemValue): string => `${value.amount} ${value.denomination}`;

export const totalCurrencyInGold = (wallet: CurrencyWallet): number => {
  return wallet.cp / 100 + wallet.sp / 10 + wallet.ep / 2 + wallet.gp + wallet.pp * 10;
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const titleCase = (value: string): string =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (entry) => entry.toUpperCase())
    .trim();
