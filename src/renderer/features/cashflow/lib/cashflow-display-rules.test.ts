import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeActualColor,
  computeHybridColor,
  getBalanceValueColor,
  getOverUnderColor,
} from '../components/cashflow-types';

describe('cashflow display rules', () => {

  it('treats equal income actuals as on target', () => {

    assert.equal(computeActualColor(2600, 2600, false), 'text-green-400');
  
});

  it('treats expense actuals within budget as green', () => {

    assert.equal(computeActualColor(-800, -900, true), 'text-green-400');
    assert.equal(computeActualColor(-900, -900, true), 'text-green-400');
    assert.equal(computeActualColor(-950, -900, true), 'text-red-400');
  
});

  it('treats hybrid income as amber when actual is behind budget', () => {

    assert.equal(computeHybridColor(0, 7000, 7000, false), 'text-amber-400');
    assert.equal(computeHybridColor(7000, 7000, 7000, false), 'text-green-400');
    assert.equal(computeHybridColor(7200, 7000, 7200, false), 'text-green-400');
  
});

  it('treats hybrid expenses as red when either actual or hybrid exceeds budget', () => {

    assert.equal(computeHybridColor(-800, -900, -850, true), 'text-green-400');
    assert.equal(computeHybridColor(-900, -900, -900, true), 'text-green-400');
    assert.equal(computeHybridColor(-950, -900, -950, true), 'text-red-400');
    assert.equal(computeHybridColor(-539.58, -1271.47, -1273.22, true), 'text-red-400');
  
});

  it('shows zero balances in green', () => {

    assert.equal(getBalanceValueColor(0), 'text-green-400');
    assert.equal(getBalanceValueColor(-0.00001), 'text-green-400');
    assert.equal(getBalanceValueColor(125.5), 'text-green-400');
    assert.equal(getOverUnderColor(0, 100, false), 'text-red-400');
    assert.equal(getOverUnderColor(0, 0, false), 'text-green-400');
  
});

});
