/**
 * RewardsStore - Manages application state, settings, calculations,
 * and persistence using localStorage.
 */
export class RewardsStore {
  constructor() {
    this.storageKey = 'rewards_calculator_settings';
    this.settings = this.loadSettings();
  }

  getDefaultSettings() {
    return {
      programs: {
        payback: {
          name: 'Payback',
          pointsRate: 1,      // 1 Punkt
          perEuro: 2,         // pro 2 Euro
          valuation: 0.01875, // 0,01875 Euro pro Punkt
        },
        milesMore: {
          name: 'Miles & More',
          milesRate: 1,       // 1 Meile
          perEuro: 2,         // pro 2 Euro
          valuation: 0.02,    // 0,02 Euro pro Meile
        },
        amex: {
          name: 'Amex',
          pointsRate: 1.5,    // 1,5 MR
          perEuro: 1,         // pro 1 Euro
          valuation: 0.02,    // 0,02 Euro pro Punkt
        },
        revolut: {
          name: 'Revolut',
          pointsRate: 1,      // 1 Punkt
          perEuro: 2,         // pro 2 Euro
          valuation: 0.02,    // 0,02 Euro pro Punkt
        }
      }
    };
  }

  loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        // Deep merge with defaults to handle potential schema updates
        const parsed = JSON.parse(stored);
        const defaults = this.getDefaultSettings();
        return this.deepMerge(defaults, parsed);
      }
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    return this.getDefaultSettings();
  }

  saveSettings(newSettings = this.settings) {
    try {
      this.settings = newSettings;
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      return true;
    } catch (e) {
      console.error('Error saving settings to localStorage:', e);
      return false;
    }
  }

  resetSettings() {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }

  /**
   * Calculates the rewards for a given spend amount and inputs.
   * @param {number} spendAmount - The amount of Euros spent.
   * @param {number} extraCashbackPercent - Optional extra cashback percent (0-100).
   * @param {number} paybackCoupon - Payback coupon multiplier (e.g., 3 for 3-fold).
   * @param {number} milesCoupon - Miles & More coupon multiplier (e.g., 5 for 5-fold).
   */
  calculate(spendAmount, extraCashbackPercent = 0, paybackCoupon = 1, milesCoupon = 1) {
    const amount = Math.max(0, parseFloat(spendAmount) || 0);
    const cbPercent = Math.max(0, parseFloat(extraCashbackPercent) || 0);
    const pbCoupon = Math.max(1, parseInt(paybackCoupon) || 1);
    const mmCoupon = Math.max(1, parseInt(milesCoupon) || 1);

    // 1. Calculate Shopping Program Values
    // Cashback
    const cashbackValue = amount * (cbPercent / 100);

    // Payback points calculation
    const pbSettings = this.settings.programs.payback;
    const paybackPoints = Math.floor(amount / pbSettings.perEuro) * pbSettings.pointsRate * pbCoupon;
    const paybackValue = paybackPoints * pbSettings.valuation;

    // Miles & More miles calculation (Loyalty Program)
    const mmSettings = this.settings.programs.milesMore;
    const milesMoreCount = Math.floor(amount / mmSettings.perEuro) * mmSettings.milesRate * mmCoupon;
    const milesMoreValue = milesMoreCount * mmSettings.valuation;

    const programs = [
      {
        id: 'none',
        name: 'Kein Programm',
        amount: 0,
        unit: '',
        value: 0
      },
      {
        id: 'payback',
        name: 'Payback',
        amount: paybackPoints,
        unit: ' Punkte',
        value: paybackValue
      },
      {
        id: 'milesMore',
        name: 'Miles & More',
        amount: milesMoreCount,
        unit: ' Meilen',
        value: milesMoreValue
      }
    ];

    // 2. Calculate Payment Method Values
    const amexSettings = this.settings.programs.amex;
    const revolutSettings = this.settings.programs.revolut;

    // M&M Card uses same rate and valuation settings as the main M&M program
    const mmCardPoints = Math.floor(amount / mmSettings.perEuro) * mmSettings.milesRate;
    const mmCardValue = mmCardPoints * mmSettings.valuation;

    const amexPoints = Math.floor(amount / amexSettings.perEuro) * amexSettings.pointsRate;
    const amexValue = amexPoints * amexSettings.valuation;

    const revolutPoints = Math.floor(amount / revolutSettings.perEuro) * revolutSettings.pointsRate;
    const revolutValue = revolutPoints * revolutSettings.valuation;

    const paymentMethods = [
      {
        id: 'none',
        name: 'Zahlungsmittel ohne Vorteile',
        rate: 0,
        value: 0
      },
      {
        id: 'milesMoreCard',
        name: 'Miles & More Card',
        points: mmCardPoints,
        unit: ' Meilen',
        value: mmCardValue
      },
      {
        id: 'amex',
        name: 'Amex',
        points: amexPoints,
        unit: ' Amex Membership Rewards',
        value: amexValue
      },
      {
        id: 'revolut',
        name: 'Revolut',
        points: revolutPoints,
        unit: ' RevPoints',
        value: revolutValue
      }
    ];

    // Find best program (excluding 'none')
    const activePrograms = programs.filter(p => p.id !== 'none');
    const bestProgram = activePrograms.length > 0 ? activePrograms.reduce((prev, current) => 
      (current.value > prev.value) ? current : prev
    , activePrograms[0]) : null;

    // Find best payment method (excluding 'none')
    const activePaymentMethods = paymentMethods.filter(pm => pm.id !== 'none');
    const bestPaymentMethod = activePaymentMethods.length > 0 ? activePaymentMethods.reduce((prev, current) => 
      (current.value > prev.value) ? current : prev
    , activePaymentMethods[0]) : null;

    return {
      amount,
      extraCashbackValue: cashbackValue,
      programs,
      paymentMethods,
      bestProgram,
      bestPaymentMethod,
      bestCombo: {
        program: bestProgram && bestProgram.value > 0 ? bestProgram : null,
        paymentMethod: bestPaymentMethod && bestPaymentMethod.value > 0 ? bestPaymentMethod : null,
        totalValue: (bestProgram ? bestProgram.value : 0) + (bestPaymentMethod ? bestPaymentMethod.value : 0) + cashbackValue
      }
    };
  }
}
