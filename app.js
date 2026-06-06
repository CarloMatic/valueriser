import { RewardsStore } from './store.js';

// Initialize the store
const store = new RewardsStore();

// Selection State
let selectedProgramId = 'none';
let selectedPaymentMethodId = 'none';

// DOM Elements - Navigation Tabs
const tabCalc = document.getElementById('tab-calc');
const tabSettings = document.getElementById('tab-settings');
const panelCalc = document.getElementById('panel-calc');
const panelSettings = document.getElementById('panel-settings');

// DOM Elements - Calculator Controls
const spendAmountInput = document.getElementById('spend-amount');

// DOM Elements - Unified Program / Benefit Selectors
const programSelector = document.getElementById('program-selector');
const bonusSliderRow = document.getElementById('bonus-slider-row');
const bonusSlider = document.getElementById('bonus-slider');
const bonusSliderInput = document.getElementById('bonus-slider-input');
const bonusSliderTitle = document.getElementById('bonus-slider-title');
const bonusSliderSuffix = document.getElementById('bonus-slider-suffix');

// DOM Elements - Cards & Grids
const programGrid = document.getElementById('program-grid');
const paymentGrid = document.getElementById('payment-grid');
const valPayback = document.getElementById('val-payback');
const rawPayback = document.getElementById('raw-payback');
const valMiles = document.getElementById('val-miles');
const rawMiles = document.getElementById('raw-miles');
const pbDesc = document.getElementById('pb-desc');
const mmDesc = document.getElementById('mm-desc');

// DOM Elements - Payment Cards
const valPayMiles = document.getElementById('val-pay-miles');
const valPayAmex = document.getElementById('val-pay-amex');
const valPayRevolut = document.getElementById('val-pay-revolut');
const descPayMiles = document.getElementById('desc-pay-miles');
const descPayAmex = document.getElementById('desc-pay-amex');
const descPayRevolut = document.getElementById('desc-pay-revolut');
const rawPayMiles = document.getElementById('raw-pay-miles');
const rawPayAmex = document.getElementById('raw-pay-amex');
const rawPayRevolut = document.getElementById('raw-pay-revolut');

// DOM Elements - Recommendations & Summary
const recommendationBanner = document.getElementById('recommendation-banner');
const recommendationText = document.getElementById('recommendation-text');
const totalVal = document.getElementById('total-val');
const totalComboDesc = document.getElementById('total-combo-desc');
const btnClearSelection = document.getElementById('btn-clear-selection');

// DOM Elements - Settings Inputs
const setPbPoints = document.getElementById('set-pb-points');
const setPbPerEuro = document.getElementById('set-pb-per-euro');
const setPbVal = document.getElementById('set-pb-val');
const setMmMiles = document.getElementById('set-mm-miles');
const setMmPerEuro = document.getElementById('set-mm-per-euro');
const setMmVal = document.getElementById('set-mm-val');
const setAmexPoints = document.getElementById('set-amex-points');
const setAmexPerEuro = document.getElementById('set-amex-per-euro');
const setAmexVal = document.getElementById('set-amex-val');
const setRevolutPoints = document.getElementById('set-revolut-points');
const setRevolutPerEuro = document.getElementById('set-revolut-per-euro');
const setRevolutVal = document.getElementById('set-revolut-val');
const btnResetSettings = document.getElementById('btn-reset-settings');
const lblPbRatioVal = document.getElementById('lbl-pb-ratio-val');
const lblMmRatioVal = document.getElementById('lbl-mm-ratio-val');
const lblAmexRatioVal = document.getElementById('lbl-amex-ratio-val');
const lblRevolutRatioVal = document.getElementById('lbl-revolut-ratio-val');

/**
 * Formats a number as Euro currency.
 * @param {number} value - The value to format.
 * @returns {string} Formatted string.
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

/**
 * Re-calculates and updates all numbers in the UI.
 */
function updateUI() {
  const spendAmount = parseFloat(spendAmountInput.value) || 0;
  
  // Read active benefit option (Kein, Cashback, Payback, Miles & More)
  const activeBtn = programSelector.querySelector('.coupon-btn.active');
  const activeProgram = activeBtn ? activeBtn.dataset.program : 'none';
  
  let extraCashback = 0;
  let paybackMultiplier = 1;
  let milesMultiplier = 1;
  const sliderValue = parseFloat(bonusSlider.value) || 0;

  if (activeProgram === 'none') {
    bonusSliderRow.classList.add('hidden');
  } else {
    bonusSliderRow.classList.remove('hidden');
    if (activeProgram === 'cashback') {
      extraCashback = sliderValue;
      bonusSliderTitle.textContent = 'Zusatz-Cashback';
      bonusSliderSuffix.textContent = '%';
    } else if (activeProgram === 'payback') {
      paybackMultiplier = Math.max(1, parseInt(sliderValue) || 1);
      bonusSliderTitle.textContent = 'Payback Coupon-Faktor';
      bonusSliderSuffix.textContent = 'x';
    } else if (activeProgram === 'milesMore') {
      milesMultiplier = Math.max(1, parseInt(sliderValue) || 1);
      bonusSliderTitle.textContent = 'Miles & More Coupon-Faktor';
      bonusSliderSuffix.textContent = 'x';
    }
  }

  // Run calculation through store
  const results = store.calculate(spendAmount, extraCashback, paybackMultiplier, milesMultiplier);

  // Update program sub-descriptions with configured valuations
  const pbValuationStr = `${store.settings.programs.payback.valuation.toFixed(3).replace(/\.?0+$/, '')} €`;
  const mmValuationStr = `${store.settings.programs.milesMore.valuation.toFixed(3).replace(/\.?0+$/, '')} €`;
  const amexValuationStr = `${store.settings.programs.amex.valuation.toFixed(3).replace(/\.?0+$/, '')} €`;
  const revolutValuationStr = `${store.settings.programs.revolut.valuation.toFixed(3).replace(/\.?0+$/, '')} €`;

  pbDesc.textContent = `${store.settings.programs.payback.pointsRate} Punkt${store.settings.programs.payback.pointsRate !== 1 ? 'e' : ''} pro ${store.settings.programs.payback.perEuro} € (Wert: ${pbValuationStr})`;
  mmDesc.textContent = `${store.settings.programs.milesMore.milesRate} Meile${store.settings.programs.milesMore.milesRate !== 1 ? 'n' : ''} pro ${store.settings.programs.milesMore.perEuro} € (Wert: ${mmValuationStr})`;

  // Update card reward values
  const progPayback = results.programs.find(p => p.id === 'payback');
  valPayback.textContent = formatCurrency(progPayback.value);
  rawPayback.textContent = `${progPayback.amount} Punkt${progPayback.amount !== 1 ? 'e' : ''}`;

  const progMiles = results.programs.find(p => p.id === 'milesMore');
  valMiles.textContent = formatCurrency(progMiles.value);
  rawMiles.textContent = `${progMiles.amount} Meile${progMiles.amount !== 1 ? 'n' : ''}`;

  // Update payment card sub-descriptions and reward values
  const payMiles = results.paymentMethods.find(pm => pm.id === 'milesMoreCard');
  descPayMiles.textContent = `${store.settings.programs.milesMore.milesRate} Meile${store.settings.programs.milesMore.milesRate !== 1 ? 'n' : ''} pro ${store.settings.programs.milesMore.perEuro} € (Wert: ${mmValuationStr})`;
  valPayMiles.textContent = formatCurrency(payMiles.value);
  rawPayMiles.textContent = `${payMiles.points} Meile${payMiles.points !== 1 ? 'n' : ''}`;

  const payAmex = results.paymentMethods.find(pm => pm.id === 'amex');
  descPayAmex.textContent = `${store.settings.programs.amex.pointsRate} MR pro ${store.settings.programs.amex.perEuro} € (Wert: ${amexValuationStr})`;
  valPayAmex.textContent = formatCurrency(payAmex.value);
  rawPayAmex.textContent = `${payAmex.points} Amex Membership Reward${payAmex.points !== 1 ? 's' : ''}`;

  const payRevolut = results.paymentMethods.find(pm => pm.id === 'revolut');
  descPayRevolut.textContent = `${store.settings.programs.revolut.pointsRate} RevP pro ${store.settings.programs.revolut.perEuro} € (Wert: ${revolutValuationStr})`;
  valPayRevolut.textContent = formatCurrency(payRevolut.value);
  rawPayRevolut.textContent = `${payRevolut.points} RevPoint${payRevolut.points !== 1 ? 's' : ''}`;

  // Clear existing best badges
  document.querySelectorAll('.best-badge').forEach(badge => badge.remove());

  if (spendAmount > 0) {
    // Inject best badges to program card and payment card
    if (results.bestProgram && results.bestProgram.value > 0) {
      const bestProgCard = document.getElementById(`prog-card-${results.bestProgram.id === 'milesMore' ? 'miles' : results.bestProgram.id}`);
      if (bestProgCard) {
        const badge = document.createElement('div');
        badge.className = 'best-badge';
        badge.textContent = 'Beste Wahl';
        bestProgCard.appendChild(badge);
      }
    }

    if (results.bestPaymentMethod && results.bestPaymentMethod.value > 0) {
      const bestPayCard = document.getElementById(`pay-card-${results.bestPaymentMethod.id === 'milesMoreCard' ? 'miles' : results.bestPaymentMethod.id}`);
      if (bestPayCard) {
        const badge = document.createElement('div');
        badge.className = 'best-badge';
        badge.textContent = 'Beste Wahl';
        bestPayCard.appendChild(badge);
      }
    }

    // Recommendation Banner
    recommendationBanner.classList.remove('hidden');
    
    let comboText = '';
    const bestP = results.bestCombo.program;
    const bestPM = results.bestCombo.paymentMethod;
    const hasExtra = results.extraCashbackValue > 0;

    if (bestP && bestPM) {
      comboText = `Kaufe über einen <span class="recommendation-highlight">${bestP.name}</span> Link und zahle mit <span class="recommendation-highlight">${bestPM.name}</span>`;
      if (hasExtra) {
        comboText = `Kaufe über einen <span class="recommendation-highlight">${bestP.name}</span> Link (inkl. <span class="recommendation-highlight">Zusatz-Cashback</span>) und zahle mit <span class="recommendation-highlight">${bestPM.name}</span>`;
      }
    } else if (bestP) {
      comboText = `Kaufe über einen <span class="recommendation-highlight">${bestP.name}</span> Link`;
      if (hasExtra) {
        comboText += ` (inkl. <span class="recommendation-highlight">Zusatz-Cashback</span>)`;
      }
    } else if (bestPM) {
      comboText = `Zahle mit <span class="recommendation-highlight">${bestPM.name}</span>`;
      if (hasExtra) {
        comboText += ` und nutze das <span class="recommendation-highlight">Zusatz-Cashback</span>`;
      }
    } else if (hasExtra) {
      comboText = `Nutze das <span class="recommendation-highlight">Zusatz-Cashback</span>`;
    }

    if (comboText) {
      comboText += ` für einen Gesamtwert von <span class="recommendation-highlight">${formatCurrency(results.bestCombo.totalValue)}</span> (${((results.bestCombo.totalValue / spendAmount) * 100).toFixed(2)}% Gesamtvorteil).`;
    } else {
      comboText = `Keine Cashback/Meilen-Vorteile erzielt.`;
    }
    recommendationText.innerHTML = comboText;
  } else {
    recommendationBanner.classList.add('hidden');
  }

  // Calculate active selected total
  const selectedProg = results.programs.find(p => p.id === selectedProgramId) || { value: 0, name: 'Kein Programm' };
  const selectedPay = results.paymentMethods.find(pm => pm.id === selectedPaymentMethodId) || { value: 0, name: 'Zahlungsmittel ohne Vorteile' };
  const combinedTotal = selectedProg.value + selectedPay.value + results.extraCashbackValue;

  totalVal.textContent = formatCurrency(combinedTotal);
  
  let comboDesc = `${selectedProg.name} (${formatCurrency(selectedProg.value)}) + ${selectedPay.name} (${formatCurrency(selectedPay.value)})`;
  if (results.extraCashbackValue > 0) {
    comboDesc += ` + Zusatz-CB (${formatCurrency(results.extraCashbackValue)})`;
  }
  totalComboDesc.textContent = comboDesc;

  // Persist calculator state
  saveCalculatorState();

  // Sync the URL pathname with the new spend amount
  updateUrlAmount(spendAmount);
}

/**
 * Handles program card selection.
 * @param {string} id - The selected program ID.
 */
function selectProgram(id) {
  selectedProgramId = id;
  const cards = programGrid.querySelectorAll('.selectable-card');
  cards.forEach(card => {
    const isSelected = card.dataset.id === id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
  updateUI();
}

/**
 * Handles payment method card selection.
 * @param {string} id - The selected payment method ID.
 */
function selectPaymentMethod(id) {
  selectedPaymentMethodId = id;
  const cards = paymentGrid.querySelectorAll('.selectable-card');
  cards.forEach(card => {
    const isSelected = card.dataset.id === id;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
  updateUI();
}

/**
 * Populates form fields in Settings view with values from the store.
 */
function loadSettingsToForm() {
  const p = store.settings.programs;

  // Payback
  setPbPoints.value = p.payback.pointsRate;
  setPbPerEuro.value = p.payback.perEuro;
  setPbVal.value = p.payback.valuation;
  lblPbRatioVal.textContent = `${p.payback.pointsRate} Pkt / ${p.payback.perEuro} €`;

  // Miles & More
  setMmMiles.value = p.milesMore.milesRate || p.milesMore.pointsRate;
  setMmPerEuro.value = p.milesMore.perEuro;
  setMmVal.value = p.milesMore.valuation;
  lblMmRatioVal.textContent = `${p.milesMore.milesRate || p.milesMore.pointsRate} Meile(n) / ${p.milesMore.perEuro} €`;

  // Amex
  setAmexPoints.value = p.amex.pointsRate;
  setAmexPerEuro.value = p.amex.perEuro;
  setAmexVal.value = p.amex.valuation;
  lblAmexRatioVal.textContent = `${p.amex.pointsRate} MR / ${p.amex.perEuro} €`;

  // Revolut
  setRevolutPoints.value = p.revolut.pointsRate;
  setRevolutPerEuro.value = p.revolut.perEuro;
  setRevolutVal.value = p.revolut.valuation;
  lblRevolutRatioVal.textContent = `${p.revolut.pointsRate} RevP / ${p.revolut.perEuro} €`;
}

function saveSettingsFromForm() {
  const updatedSettings = {
    programs: {
      payback: {
        name: 'Payback',
        pointsRate: parseFloat(setPbPoints.value) || 1,
        perEuro: parseInt(setPbPerEuro.value) || 2,
        valuation: parseFloat(setPbVal.value) || 0.01875
      },
      milesMore: {
        name: 'Miles & More',
        milesRate: parseFloat(setMmMiles.value) || 1,
        perEuro: parseInt(setMmPerEuro.value) || 2,
        valuation: parseFloat(setMmVal.value) || 0.02
      },
      amex: {
        name: 'Amex',
        pointsRate: parseFloat(setAmexPoints.value) || 1.5,
        perEuro: parseInt(setAmexPerEuro.value) || 1,
        valuation: parseFloat(setAmexVal.value) || 0.02
      },
      revolut: {
        name: 'Revolut',
        pointsRate: parseFloat(setRevolutPoints.value) || 1,
        perEuro: parseInt(setRevolutPerEuro.value) || 2,
        valuation: parseFloat(setRevolutVal.value) || 0.02
      }
    }
  };

  store.saveSettings(updatedSettings);

  // Update ratio labels in the form
  lblPbRatioVal.textContent = `${updatedSettings.programs.payback.pointsRate} Pkt / ${updatedSettings.programs.payback.perEuro} €`;
  lblMmRatioVal.textContent = `${updatedSettings.programs.milesMore.milesRate} Meile(n) / ${updatedSettings.programs.milesMore.perEuro} €`;
  lblAmexRatioVal.textContent = `${updatedSettings.programs.amex.pointsRate} MR / ${updatedSettings.programs.amex.perEuro} €`;
  lblRevolutRatioVal.textContent = `${updatedSettings.programs.revolut.pointsRate} RevP / ${updatedSettings.programs.revolut.perEuro} €`;

  updateUI();
}

function saveCalculatorState() {
  const activeBtn = programSelector.querySelector('.coupon-btn.active');
  const state = {
    amount: spendAmountInput.value,
    programOption: activeBtn ? activeBtn.dataset.program : 'none',
    sliderValue: bonusSlider.value,
    programId: selectedProgramId,
    paymentMethodId: selectedPaymentMethodId
  };
  localStorage.setItem('valueriser_calculator_state', JSON.stringify(state));
}

function loadCalculatorState() {
  try {
    const stored = localStorage.getItem('valueriser_calculator_state');
    if (stored) {
      const state = JSON.parse(stored);
      if (state.amount !== undefined) spendAmountInput.value = state.amount;
      
      const option = state.programOption || 'none';
      programSelector.querySelectorAll('.coupon-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.program === option);
      });
      
      configureSlider(option);
      
      if (state.sliderValue !== undefined) {
        bonusSlider.value = state.sliderValue;
        bonusSliderInput.value = state.sliderValue;
      }
      if (state.programId !== undefined) selectedProgramId = state.programId;
      if (state.paymentMethodId !== undefined) selectedPaymentMethodId = state.paymentMethodId;
    }
  } catch (e) {
    console.error('Error loading calculator state:', e);
  }
}

/**
 * Helper to determine the app's base pathname, handling subdirectory hosting (e.g. GitHub Pages)
 * and custom domain hosting seamlessly.
 * @returns {string} The base path ending with a slash.
 */
function getAppBasePath() {
  const pathname = window.location.pathname;
  const segments = pathname.split('/');
  
  // Pop 'index.html' or 'index.htm' if present at the end
  if (segments.length > 1) {
    const last = segments[segments.length - 1];
    if (last === 'index.html' || last === 'index.htm') {
      segments.pop();
    }
  }
  
  // Pop the numeric amount if it is present at the end
  if (segments.length > 1) {
    const last = segments[segments.length - 1];
    if (last && !isNaN(parseFloat(last)) && isFinite(last)) {
      segments.pop();
    }
  }
  
  let basePath = segments.join('/');
  if (!basePath.endsWith('/')) {
    basePath += '/';
  }
  return basePath;
}

/**
 * Updates the URL path dynamically with the spend amount, preserving subdirectories.
 * @param {number|string} amount - The spend amount.
 */
function updateUrlAmount(amount) {
  const parsedAmount = parseFloat(amount);
  const basePath = getAppBasePath();
  
  let newPath = basePath;
  if (!isNaN(parsedAmount) && parsedAmount > 0) {
    newPath += parsedAmount;
  }
  
  if (window.location.pathname !== newPath) {
    window.history.replaceState(null, '', newPath + window.location.search + window.location.hash);
  }
}

/**
 * Configure ranges, steps and visibility for the single slider based on selected option.
 * @param {string} option - none, cashback, payback, milesMore
 */
function configureSlider(option) {
  if (option === 'none') {
    bonusSliderRow.classList.add('hidden');
  } else {
    bonusSliderRow.classList.remove('hidden');
    if (option === 'cashback') {
      bonusSlider.min = '0';
      bonusSlider.max = '10';
      bonusSlider.step = '0.05';
      bonusSliderInput.min = '0';
      bonusSliderInput.max = '10';
      bonusSliderInput.step = '0.05';
      bonusSliderTitle.textContent = 'Zusatz-Cashback';
      bonusSliderSuffix.textContent = '%';
    } else if (option === 'payback') {
      bonusSlider.min = '1';
      bonusSlider.max = '50';
      bonusSlider.step = '1';
      bonusSliderInput.min = '1';
      bonusSliderInput.max = '50';
      bonusSliderInput.step = '1';
      bonusSliderTitle.textContent = 'Payback Coupon-Faktor';
      bonusSliderSuffix.textContent = 'x';
    } else if (option === 'milesMore') {
      bonusSlider.min = '1';
      bonusSlider.max = '50';
      bonusSlider.step = '1';
      bonusSliderInput.min = '1';
      bonusSliderInput.max = '50';
      bonusSliderInput.step = '1';
      bonusSliderTitle.textContent = 'Miles & More Coupon-Faktor';
      bonusSliderSuffix.textContent = 'x';
    }
  }
}

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  // Support ?amount=, ?a=, or ?p= (from 404 redirect)
  let amount = urlParams.get('amount') || urlParams.get('a') || urlParams.get('p');
  
  if (!amount) {
    const segments = window.location.pathname.split('/');
    // Filter out empty segments (e.g. trailing slash) and check the last non-empty segment
    const cleanSegments = segments.filter(seg => seg.length > 0 && seg !== 'index.html' && seg !== 'index.htm');
    if (cleanSegments.length > 0) {
      const lastSegment = cleanSegments[cleanSegments.length - 1];
      if (lastSegment && !isNaN(parseFloat(lastSegment)) && isFinite(lastSegment)) {
        amount = lastSegment;
      }
    }
  }

  // Fallback to hash (e.g. #1000 or #/1000)
  if (!amount && window.location.hash) {
    const hashVal = window.location.hash.replace(/^#\/?/, '');
    if (hashVal && !isNaN(parseFloat(hashVal)) && isFinite(hashVal)) {
      amount = hashVal;
    }
  }
  
  const parsedAmount = parseFloat(amount);
  if (!isNaN(parsedAmount) && parsedAmount > 0) {
    spendAmountInput.value = parsedAmount;
    
    // Clean up the URL to present a beautiful, clean relative path (e.g. /1000 or /valueriser/1000)
    const basePath = getAppBasePath();
    const cleanPath = basePath + parsedAmount;
    
    // Clean up temporary query parameters to make URL pristine
    urlParams.delete('p');
    urlParams.delete('amount');
    urlParams.delete('a');
    const searchString = urlParams.toString();
    const newSearch = searchString ? '?' + searchString : '';
    
    window.history.replaceState(null, '', cleanPath + newSearch + window.location.hash);
  }
}

// --- Event Listeners Setup ---

// Input changes trigger immediate recalculation
spendAmountInput.addEventListener('input', updateUI);

// Sync Bonus Slider and Input
bonusSlider.addEventListener('input', () => {
  bonusSliderInput.value = bonusSlider.value;
  updateUI();
});

bonusSliderInput.addEventListener('input', () => {
  const activeBtn = programSelector.querySelector('.coupon-btn.active');
  const activeProgram = activeBtn ? activeBtn.dataset.program : 'none';
  
  let val = parseFloat(bonusSliderInput.value);
  if (isNaN(val)) val = 0;
  
  if (activeProgram === 'cashback') {
    if (val < 0) val = 0;
    if (val > 10) val = 10;
  } else {
    val = Math.round(val);
    if (val < 1) val = 1;
    if (val > 50) val = 50;
  }
  
  bonusSlider.value = val;
  updateUI();
});

// Program Selector Click handler (Kein, Cashback, Payback, Miles & More)
programSelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.coupon-btn');
  if (!btn) return;
  programSelector.querySelectorAll('.coupon-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  const program = btn.dataset.program;
  
  // Configure range constraints
  configureSlider(program);
  
  // Set default starting values on swap
  if (program === 'cashback') {
    bonusSlider.value = '0';
    bonusSliderInput.value = '0';
  } else {
    bonusSlider.value = '1';
    bonusSliderInput.value = '1';
  }
  
  // Auto-select program in the grid (None, Payback, Miles & More)
  if (program === 'payback' || program === 'milesMore') {
    selectProgram(program);
  } else {
    selectProgram('none');
  }
  
  updateUI();
});

// Card list selection clicks
programGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.selectable-card');
  if (!card) return;
  selectProgram(card.dataset.id);
});

paymentGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.selectable-card');
  if (!card) return;
  selectPaymentMethod(card.dataset.id);
});

// Clear selections
btnClearSelection.addEventListener('click', () => {
  selectProgram('none');
  selectPaymentMethod('none');
});

// Tab Switching
tabCalc.addEventListener('click', () => {
  tabCalc.classList.add('active');
  tabCalc.setAttribute('aria-selected', 'true');
  tabSettings.classList.remove('active');
  tabSettings.setAttribute('aria-selected', 'false');

  panelCalc.classList.add('active');
  panelSettings.classList.remove('active');
});

tabSettings.addEventListener('click', () => {
  tabSettings.classList.add('active');
  tabSettings.setAttribute('aria-selected', 'true');
  tabCalc.classList.remove('active');
  tabCalc.setAttribute('aria-selected', 'false');

  panelSettings.classList.add('active');
  panelCalc.classList.remove('active');

  loadSettingsToForm();
});

// Settings inputs change listeners for instant save
const allSettingsInputs = [
  setPbPoints, setPbPerEuro, setPbVal,
  setMmMiles, setMmPerEuro, setMmVal,
  setAmexPoints, setAmexPerEuro, setAmexVal,
  setRevolutPoints, setRevolutPerEuro, setRevolutVal
];
allSettingsInputs.forEach(input => {
  input.addEventListener('input', saveSettingsFromForm);
});

// Reset settings to defaults
btnResetSettings.addEventListener('click', () => {
  if (confirm('Möchtest du wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
    store.resetSettings();
    loadSettingsToForm();
    updateUI();
  }
});

// --- Impressum Modal Toggle Logic ---
const linkImpressum = document.getElementById('link-impressum');
const linkImpressumSettings = document.getElementById('link-impressum-settings');
const modalImpressum = document.getElementById('impressum-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalOverlay = modalImpressum ? modalImpressum.querySelector('.modal-overlay') : null;

function openModal() {
  if (modalImpressum) {
    modalImpressum.classList.add('active');
    modalImpressum.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Prevents scrolling behind the modal
  }
}

function closeModal() {
  if (modalImpressum) {
    modalImpressum.classList.remove('active');
    modalImpressum.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restores scrolling
  }
}

if (linkImpressum) linkImpressum.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
if (linkImpressumSettings) linkImpressumSettings.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Init execution
loadSettingsToForm();
loadCalculatorState();
parseUrlParams();
updateUI();
selectProgram(selectedProgramId);
selectPaymentMethod(selectedPaymentMethodId);
