import { Money } from '@nnoo/contracts';

/**
 * Ensures that two Money objects share the same currency.
 */
export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currencyCode !== b.currencyCode) {
    throw new Error(
      `Currency mismatch: cannot operate on ${a.currencyCode} and ${b.currencyCode}`
    );
  }
}

/**
 * Parses a string input (e.g., "1250.50") into a Money object using integer minor units.
 * For example, 1250.50 NGN -> 125050 minor units.
 * Avoids any floating-point math internally.
 */
export function parseMoneyInput(
  input: string,
  currencyCode: string,
  minorUnitsPerMajor: number = 100
): Money {
  const cleanInput = input.trim().replace(/,/g, '');
  
  if (!cleanInput.match(/^-?\d+(\.\d+)?$/)) {
    throw new Error(`Invalid money input format: ${input}`);
  }

  const isNegative = cleanInput.startsWith('-');
  const absoluteInput = isNegative ? cleanInput.slice(1) : cleanInput;

  const [majorStr, minorStr = ''] = absoluteInput.split('.');
  
  // Pad the minor units to the required precision
  const fractionDigits = Math.log10(minorUnitsPerMajor);
  if (minorStr.length > fractionDigits) {
    throw new Error(`Precision error: input ${input} has too many decimal places`);
  }

  const paddedMinor = minorStr.padEnd(fractionDigits, '0');
  let totalMinor = BigInt(majorStr || '0') * BigInt(minorUnitsPerMajor) + BigInt(paddedMinor);
  
  if (isNegative) {
    totalMinor = -totalMinor;
  }

  return {
    amountMinor: totalMinor.toString(),
    currencyCode,
  };
}

/**
 * Converts a Money object back to a display string (e.g., "1250.50").
 */
export function minorUnitsToDisplay(
  money: Money,
  minorUnitsPerMajor: number = 100
): string {
  const amount = BigInt(money.amountMinor);
  const isNegative = amount < 0n;
  const absAmount = isNegative ? -amount : amount;
  
  const divisor = BigInt(minorUnitsPerMajor);
  const major = absAmount / divisor;
  const minor = absAmount % divisor;
  
  const fractionDigits = Math.log10(minorUnitsPerMajor);
  const minorStr = minor.toString().padStart(fractionDigits, '0');
  
  const prefix = isNegative ? '-' : '';
  return `${prefix}${major.toString()}.${minorStr}`;
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const sum = BigInt(a.amountMinor) + BigInt(b.amountMinor);
  return {
    amountMinor: sum.toString(),
    currencyCode: a.currencyCode,
  };
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const diff = BigInt(a.amountMinor) - BigInt(b.amountMinor);
  return {
    amountMinor: diff.toString(),
    currencyCode: a.currencyCode,
  };
}

export function sumMoney(monies: Money[], currencyCode: string): Money {
  let total = 0n;
  for (const m of monies) {
    if (m.currencyCode !== currencyCode) {
      throw new Error(`Currency mismatch in sum: expected ${currencyCode}, got ${m.currencyCode}`);
    }
    total += BigInt(m.amountMinor);
  }
  return {
    amountMinor: total.toString(),
    currencyCode,
  };
}

export function multiplyMoneyByInteger(money: Money, multiplier: number): Money {
  if (!Number.isInteger(multiplier)) {
    throw new Error('Multiplier must be an integer');
  }
  const result = BigInt(money.amountMinor) * BigInt(multiplier);
  return {
    amountMinor: result.toString(),
    currencyCode: money.currencyCode,
  };
}
