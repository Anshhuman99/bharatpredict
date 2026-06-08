/**
 * LMSR AMM Pricing Engine
 * Implements a numerically stable Logarithmic Market Scoring Rule (LMSR)
 * with analytical formulas to compute exact shares for a given cash amount (INR).
 */

export class LMSR {
  /**
   * Numerically stable cost function using the Log-Sum-Exp trick.
   * C = b * ln(e^(q1/b) + e^(q2/b))
   */
  static calculateCost(q1: number, q2: number, b: number): number {
    const x1 = q1 / b;
    const x2 = q2 / b;
    const max = Math.max(x1, x2);
    // C = b * (max + ln(e^(x1 - max) + e^(x2 - max)))
    return b * (max + Math.log(Math.exp(x1 - max) + Math.exp(x2 - max)));
  }

  /**
   * Get the current probability of YES shares.
   * Price = e^(q1/b) / (e^(q1/b) + e^(q2/b))
   */
  static getYesPrice(q1: number, q2: number, b: number): number {
    const x1 = q1 / b;
    const x2 = q2 / b;
    const max = Math.max(x1, x2);
    const exp1 = Math.exp(x1 - max);
    const exp2 = Math.exp(x2 - max);
    const price = exp1 / (exp1 + exp2);
    // Clamp between ₹0.02 and ₹0.98 to avoid extreme pricing limits
    return Math.max(0.02, Math.min(0.98, price));
  }

  /**
   * Get the current price of NO shares.
   * Price = e^(q2/b) / (e^(q1/b) + e^(q2/b))
   */
  static getNoPrice(q1: number, q2: number, b: number): number {
    return 1 - this.getYesPrice(q1, q2, b);
  }

  /**
   * Calculate probability for a specific outcome.
   * Add: calculateProbability()
   */
  static calculateProbability(q1: number, q2: number, b: number, side: 'YES' | 'NO'): number {
    if (side === 'YES') {
      return this.getYesPrice(q1, q2, b);
    } else {
      return this.getNoPrice(q1, q2, b);
    }
  }

  /**
   * Calculate exact cost in INR to purchase deltaShares of YES or NO.
   * Add: calculateTradeCost()
   */
  static calculateTradeCost(q1: number, q2: number, b: number, deltaShares: number, side: 'YES' | 'NO'): number {
    const initialCost = this.calculateCost(q1, q2, b);
    let finalCost = 0;
    
    if (side === 'YES') {
      finalCost = this.calculateCost(q1 + deltaShares, q2, b);
    } else {
      finalCost = this.calculateCost(q1, q2 + deltaShares, b);
    }

    return finalCost - initialCost;
  }

  /**
   * Calculate exactly how many YES shares a user gets for spending cash A.
   * Numerically stable formula:
   * delta_s = b * [x1 + ln(1 - e^(x2 - x1))] - q1
   * where x1 = (A + C0)/b, x2 = q2/b
   */
  static calculateYesSharesForCash(q1: number, q2: number, b: number, cashAmount: number): number {
    const C0 = this.calculateCost(q1, q2, b);
    const x1 = (cashAmount + C0) / b;
    const x2 = q2 / b;
    
    const diff = x2 - x1;
    // Handle edge conditions where diff is too close to 0 to prevent NaN
    if (diff >= 0) return 0;
    
    const term = Math.log(1 - Math.exp(diff));
    const finalQ1 = b * (x1 + term);
    
    const shares = finalQ1 - q1;
    return Math.max(0, shares);
  }

  /**
   * Calculate exactly how many NO shares a user gets for spending cash A.
   * Numerically stable formula:
   * delta_s = b * [x1 + ln(1 - e^(x2_prime - x1))] - q2
   * where x1 = (A + C0)/b, x2_prime = q1/b
   */
  static calculateNoSharesForCash(q1: number, q2: number, b: number, cashAmount: number): number {
    const C0 = this.calculateCost(q1, q2, b);
    const x1 = (cashAmount + C0) / b;
    const x2Prime = q1 / b;
    
    const diff = x2Prime - x1;
    if (diff >= 0) return 0;
    
    const term = Math.log(1 - Math.exp(diff));
    const finalQ2 = b * (x1 + term);
    
    const shares = finalQ2 - q2;
    return Math.max(0, shares);
  }

  /**
   * Upgrade LMSR Pricing: Calculate shares received including platform fees and expected slippage.
   * Add: calculateSharesReceived()
   */
  static calculateSharesReceived(
    q1: number,
    q2: number,
    b: number,
    cashAmount: number,
    side: 'YES' | 'NO',
    feePercent: number = 0.01, // 1% platform fee
  ): { shares: number; fee: number; netAmount: number; avgPrice: number; slippage: number } {
    const fee = cashAmount * feePercent;
    const netAmount = cashAmount - fee;
    
    let shares = 0;
    if (side === 'YES') {
      shares = this.calculateYesSharesForCash(q1, q2, b, netAmount);
    } else {
      shares = this.calculateNoSharesForCash(q1, q2, b, netAmount);
    }

    if (shares <= 0) {
      return { shares: 0, fee, netAmount, avgPrice: 0, slippage: 0 };
    }

    // Average price is total cash spent divided by shares received
    const avgPrice = cashAmount / shares;
    const spotPrice = side === 'YES' ? this.getYesPrice(q1, q2, b) : this.getNoPrice(q1, q2, b);
    
    const slippage = spotPrice > 0 ? Math.max(0, (avgPrice - spotPrice) / spotPrice) : 0;

    return {
      shares,
      fee,
      netAmount,
      avgPrice,
      slippage,
    };
  }
}
