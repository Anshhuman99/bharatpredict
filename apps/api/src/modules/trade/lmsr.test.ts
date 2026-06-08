import { LMSR } from './lmsr';

console.log('🧪 Starting LMSR AMM Pricing Engine Unit Tests...');

try {
  // Test 1: Probability calculations
  const pYes = LMSR.calculateProbability(120, 80, 150, 'YES');
  const pNo = LMSR.calculateProbability(120, 80, 150, 'NO');
  console.log(`- Probabilities: YES = ${pYes.toFixed(4)}, NO = ${pNo.toFixed(4)}`);
  if (Math.abs(pYes + pNo - 1.0) > 0.0001) {
    throw new Error('Probabilities must sum to 1');
  }
  console.log('✅ Test 1 Passed: Probability consistency verified!');

  // Test 2: Cost calculations
  const cost = LMSR.calculateTradeCost(120, 80, 150, 10, 'YES');
  console.log(`- Cost to buy 10 YES shares: ₹${cost.toFixed(2)}`);
  if (cost <= 0) {
    throw new Error('Cost must be positive for purchases');
  }
  console.log('✅ Test 2 Passed: Purchase costs positive!');

  // Test 3: Platform fee and slippage math
  const preview = LMSR.calculateSharesReceived(120, 80, 150, 1000, 'YES', 0.01);
  console.log(`- Preview for ₹1000 YES purchase:`);
  console.log(`  - Shares received: ${preview.shares.toFixed(2)}`);
  console.log(`  - Platform fee: ₹${preview.fee.toFixed(2)}`);
  console.log(`  - Avg share price: ₹${preview.avgPrice.toFixed(2)}`);
  console.log(`  - Expected slippage: ${(preview.slippage * 100).toFixed(2)}%`);

  if (Math.abs(preview.fee - 10.0) > 0.0001) {
    throw new Error('Fee deduction mismatch');
  }
  if (preview.shares <= 0) {
    throw new Error('Shares received must be positive');
  }
  if (preview.slippage < 0) {
    throw new Error('Slippage cannot be negative');
  }

  console.log('✅ Test 3 Passed: Platform fees and slippage calculations verified!');
  console.log('\n🎉 ALL LMSR AMM ENGINE TESTS PASSED SUCCESSFULLY!');
} catch (e: any) {
  console.error('\n❌ Unit Test Suite Failed:');
  console.error(e.message || e);
  process.exit(1);
}
