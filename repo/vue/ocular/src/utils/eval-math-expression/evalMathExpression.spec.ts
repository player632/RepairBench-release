import { evalMathExpression } from './evalMathExpression';
import { it, expect } from 'vitest';

const us = { group: ',', decimal: '.' };
const de = { group: '.', decimal: ',' };

// Test basic operations
it('evaluates addition correctly', () => {
  expect(evalMathExpression('2 + 3', us)).toBe(5);
  expect(evalMathExpression('10 + 20', us)).toBe(30);
});

it('evaluates subtraction correctly', () => {
  expect(evalMathExpression('5 - 2', us)).toBe(3);
  expect(evalMathExpression('10 - 20', us)).toBe(-10);
});

it('evaluates multiplication correctly', () => {
  expect(evalMathExpression('2 * 3', us)).toBe(6);
  expect(evalMathExpression('10 * 20', us)).toBe(200);
});

it('evaluates division correctly', () => {
  expect(evalMathExpression('6 / 2', us)).toBe(3);
  expect(evalMathExpression('10 / 2', us)).toBe(5);
});

it('handles division by zero', () => {
  expect(() => evalMathExpression('5 / 0', us)).toThrow('Division by zero');
});

// Test operator precedence
it('respects operator precedence', () => {
  expect(evalMathExpression('2 + 3 * 4', us)).toBe(14);
  expect(evalMathExpression('2 * 3 + 4', us)).toBe(10);
  expect(evalMathExpression('10 - 2 * 3', us)).toBe(4);
  expect(evalMathExpression('10 / 2 + 3', us)).toBe(8);
});

// Test parentheses
it('evaluates expressions with parentheses correctly', () => {
  expect(evalMathExpression('(2 + 3) * 4', us)).toBe(20);
  expect(evalMathExpression('2 * (3 + 4)', us)).toBe(14);
  expect(evalMathExpression('(10 - 2) * (3 + 4)', us)).toBe(56);
  expect(evalMathExpression('(10 / (1 + 1)) + 3', us)).toBe(8);
});

// Test nested parentheses
it('handles nested parentheses correctly', () => {
  expect(evalMathExpression('2 * (3 + (4 - 2))', us)).toBe(10);
  expect(evalMathExpression('((2 + 3) * 4) / 2', us)).toBe(10);
  expect(evalMathExpression('(2 + (3 * (4 - 1)))', us)).toBe(11);
});

// Test whitespace handling
it('handles different whitespace patterns', () => {
  expect(evalMathExpression('2+3', us)).toBe(5);
  expect(evalMathExpression('2 +3', us)).toBe(5);
  expect(evalMathExpression('2+ 3', us)).toBe(5);
  expect(evalMathExpression(' 2 + 3 ', us)).toBe(5);
  expect(evalMathExpression('(2+3)*(4-1)', us)).toBe(15);
});

// Test complex expressions
it('evaluates complex expressions correctly', () => {
  expect(evalMathExpression('2 + 3 * 4 - 6 / 2', us)).toBe(11);
  expect(evalMathExpression('(2 + 3) * (4 - 6 / 2)', us)).toBe(5);
  expect(evalMathExpression('10 / (2 + 3) * 4 - 1', us)).toBe(7);
});

// Test error cases
it('handles invalid expressions', () => {
  expect(() => evalMathExpression('', us)).toThrow();
  expect(() => evalMathExpression('2 +', us)).toThrow('Invalid expression');
  expect(() => evalMathExpression('+ 2', us)).toThrow('Invalid expression');
});

it('handles invalid numbers', () => {
  expect(() => evalMathExpression('2 + 3.5.6', us)).toThrow('Invalid number');
});

it('handles mismatched parentheses', () => {
  expect(() => evalMathExpression('(2 + 3', us)).toThrow('Mismatched parentheses');
  expect(() => evalMathExpression('2 + 3)', us)).toThrow('Mismatched parentheses');
  expect(() => evalMathExpression('((2 + 3)', us)).toThrow('Mismatched parentheses');
});

// Test decimal numbers
it('handles decimal numbers correctly', () => {
  expect(evalMathExpression('2.5 + 3.5', us)).toBe(6);
  expect(evalMathExpression('2.5 * 2', us)).toBe(5);
  expect(evalMathExpression('5 / 2', us)).toBe(2.5);
  expect(evalMathExpression('(1.5 + 2.5) * 2', us)).toBe(8);
});

// Test invalid characters
it('throws error for invalid characters', () => {
  expect(() => evalMathExpression('2 $ 3', us)).toThrow('Invalid character');
  expect(() => evalMathExpression('2 @ 3', us)).toThrow('Invalid character');
});

// Test localizations
it('handles different number formats', () => {
  expect(evalMathExpression('1,000 + 2,000', us)).toBe(3000);
  expect(evalMathExpression('1.000 + 2.000', de)).toBe(3000);
  expect(evalMathExpression('1.5 + 2.5', us)).toBe(4);
  expect(evalMathExpression('1,5 + 2,5', de)).toBe(4);
});
