let translations = {};

async function loadTranslations() {
    try {
        const result = await fetch('data/field.json');
        if (!result.ok) {
            throw new Error('Failed to load translations');
        }
        translations = await result.json();
        updateCategoryVisibility();
        updateLanguage();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

let currentLanguage = 'en';

// Constants (Check too, Alya and Tep)
const STANDARD_RELIEF = 1500000;
const DEPENDENT_DEDUCTION = 150000;
const VAT_RATE = 0.10;
const WHT_RATE = 0.15;
const PROPERTY_THRESHOLD = 100000000;
const PROPERTY_RATE = 0.001;

const elements = {
    baseAmount: document.getElementById('baseAmount'),
    taxCategory: document.getElementById('taxCategory'),
    vatModeGroup: document.getElementById('vatModeGroup'),
    salaryDeductionsSection: document.getElementById('salaryDeductionsSection'),
    monthlySalary: document.getElementById('monthlySalary'),
    spouseStatus: document.getElementById('spouseStatus'),
    childrenCount: document.getElementById('childrenCount'),
    otherDependents: document.getElementById('otherDependents'),
    calculateBtn: document.getElementById('calculateBtn')
};

function updateCategoryVisibility() {
    const category = elements.taxCategory.value;
    const isSalary = category === 'salary';
    const isVat = category === 'vat';
    
    elements.vatModeGroup.style.display = isVat ? 'block' : 'none';
    elements.salaryDeductionsSection.style.display = isSalary ? 'block' : 'none';
    
    if (isSalary) {
        updateDeductionSummary();
    }
}

// Calculate total salary deductions
function calculateSalaryDeductions() {
    const monthlySalary = parseFloat(elements.monthlySalary.value) || 0;
    const spouseStatus = elements.spouseStatus.value;
    const childrenCount = parseInt(elements.childrenCount.value) || 0;
    const otherDependents = parseInt(elements.otherDependents.value) || 0;
    
    let spouseDeduction = (spouseStatus === 'housewife') ? DEPENDENT_DEDUCTION : 0;
    let childrenDeduction = childrenCount * DEPENDENT_DEDUCTION;
    let otherDeduction = otherDependents * DEPENDENT_DEDUCTION;
    let totalDeductions = spouseDeduction + childrenDeduction + otherDeduction;
    
    return {
        monthlySalary,
        spouseDeduction,
        childrenDeduction,
        otherDeduction,
        totalDeductions,
        taxableIncome: Math.max(0, monthlySalary - totalDeductions)
    };
}

function updateDeductionSummary() {
    const deductions = calculateSalaryDeductions();
    
    document.getElementById('standardReliefValue').innerHTML = `${STANDARD_RELIEF.toLocaleString()} KHR`;
    document.getElementById('spouseDeductionValue').innerHTML = `${deductions.spouseDeduction.toLocaleString()} KHR`;
    document.getElementById('childrenDeductionValue').innerHTML = `${deductions.childrenDeduction.toLocaleString()} KHR`;
    document.getElementById('otherDeductionValue').innerHTML = `${deductions.otherDeduction.toLocaleString()} KHR`;
    document.getElementById('totalDeductionValue').innerHTML = `${deductions.totalDeductions.toLocaleString()} KHR`;
}

/**
 * Cambodia's law on Tax on Salary (Please help verify the brackets and rates with the latest official sources):
 */
function calculateSalaryTax(taxableIncome) {
    if (taxableIncome <= 0) return 0;
    
    let tax = 0;
    let remaining = taxableIncome;
    
    if (remaining > 1500000) {
        let tier1 = Math.min(remaining, 2000000) - 1500000;
        if (tier1 > 0) tax += tier1 * 0.05;
    }
    if (remaining > 2000000) {
        let tier2 = Math.min(remaining, 8500000) - 2000000;
        if (tier2 > 0) tax += tier2 * 0.10;
    }
    if (remaining > 8500000) {
        let tier3 = Math.min(remaining, 12500000) - 8500000;
        if (tier3 > 0) tax += tier3 * 0.15;
    }
    if (remaining > 12500000) {
        let tier4 = remaining - 12500000;
        tax += tier4 * 0.20;
    }
    
    return Math.round(tax);
}

function calculateVAT(amount, mode) {
    if (mode === 'exclusive') {
        const vat = amount * VAT_RATE;
        return { taxAmount: Math.round(vat), taxableBase: amount, total: amount + vat };
    } else {
        const vat = amount * (VAT_RATE / (1 + VAT_RATE));
        const taxableBase = amount - vat;
        return { taxAmount: Math.round(vat), taxableBase: Math.round(taxableBase), total: amount };
    }
}

function calculateWHT(amount) {
    const tax = amount * WHT_RATE;
    return { taxAmount: Math.round(tax), taxableBase: amount, total: amount - tax };
}

function calculatePropertyTax(value) {
    if (value <= PROPERTY_THRESHOLD) {
        return { taxAmount: 0, taxableBase: 0, total: value };
    }
    const excess = value - PROPERTY_THRESHOLD;
    const tax = excess * PROPERTY_RATE;
    return { taxAmount: Math.round(tax), taxableBase: excess, total: value - tax };
}

function calculate() {
    const category = elements.taxCategory.value;
    let amount = parseFloat(elements.baseAmount.value) || 0;
    let taxAmount = 0;
    let taxableBase = 0;
    let total = 0;
    let breakdown = '';
    let grossAmount = amount;
    let totalDeductions = 0;
    
    if (category === 'vat') {
        const vatMode = document.querySelector('input[name="vatMode"]:checked').value;
        const result = calculateVAT(amount, vatMode);
        taxAmount = result.taxAmount;
        taxableBase = result.taxableBase;
        total = result.total;
        breakdown = currentLanguage === 'en' 
            ? `VAT calculated at 10% (${vatMode === 'exclusive' ? 'added to base' : 'included in amount'})`
            : `អាករគណនា ១០% (${vatMode === 'exclusive' ? 'បន្ថែមលើតម្លៃ' : 'រួមបញ្ចូលក្នុងចំនួន'})`;
    } 
    else if (category === 'salary') {
        const deductions = calculateSalaryDeductions();
        grossAmount = deductions.monthlySalary;
        taxableBase = deductions.taxableIncome;
        taxAmount = calculateSalaryTax(taxableBase);
        total = grossAmount - taxAmount;
        totalDeductions = deductions.totalDeductions;
        
        breakdown = currentLanguage === 'en'
            ? `Tax Calculation Breakdown: Standard Relief: ${STANDARD_RELIEF.toLocaleString()} KHR, Spouse Deduction: ${deductions.spouseDeduction.toLocaleString()} KHR, Children (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} KHR, Other Dependents (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} KHR, Progressive rates: 0%→5%→10%→15%→20%`
            : `ការគណនាពន្ធ: ការកាត់បន្ថយស្តង់ដារ: ${STANDARD_RELIEF.toLocaleString()} រៀល, ការកាត់បន្ថយស្វាមី/ភរិយា: ${deductions.spouseDeduction.toLocaleString()} រៀល, កូន (${elements.childrenCount.value || 0}): ${deductions.childrenDeduction.toLocaleString()} រៀល, អ្នកនៅក្នុងបន្ទុក (${elements.otherDependents.value || 0}): ${deductions.otherDeduction.toLocaleString()} រៀល, អត្រារីកចម្រើន: ០%→៥%→១០%→១៥%→២០%`;
    } 
    else if (category === 'withholding') {
        const result = calculateWHT(amount);
        taxAmount = result.taxAmount;
        taxableBase = result.taxableBase;
        total = result.total;
        breakdown = currentLanguage === 'en'
            ? `Withholding Tax (WHT) 15% on service payments`
            : `ពន្ធទុកដាក់ ១៥% លើការបង់ថ្លៃសេវា`;
    } 
    else if (category === 'property') {
        const result = calculatePropertyTax(amount);
        taxAmount = result.taxAmount;
        taxableBase = result.taxableBase;
        total = result.total;
        breakdown = currentLanguage === 'en'
            ? `Property Tax: 0.1% on value exceeding ${PROPERTY_THRESHOLD.toLocaleString()} KHR`
            : `ពន្ធអចលនទ្រព្យ: ០.១% លើតម្លៃលើស ${PROPERTY_THRESHOLD.toLocaleString()} រៀល`;
    }
    
    document.getElementById('grossAmountValue').innerHTML = `${Math.round(grossAmount).toLocaleString()} KHR`;
    document.getElementById('totalDeductionsValue').innerHTML = `${totalDeductions.toLocaleString()} KHR`;
    document.getElementById('taxableIncomeValue').innerHTML = `${Math.round(taxableBase).toLocaleString()} KHR`;
    document.getElementById('taxAmountValue').innerHTML = `${taxAmount.toLocaleString()} KHR`;
    document.getElementById('netPayableValue').innerHTML = `${Math.round(total).toLocaleString()} KHR`;
    
    const breakdownElement = document.getElementById('taxBreakdown');
    breakdownElement.innerHTML = breakdown;
    breakdownElement.style.display = 'block';
}

function updateLanguage() {
    const t = translations[currentLanguage];
    
    document.getElementById('mainTitle').innerText = t.mainTitle;
    document.getElementById('subTitle').innerText = t.subTitle;
    document.getElementById('lblAmount').innerText = t.lblAmount;
    document.getElementById('lblCategory').innerText = t.lblCategory;
    document.getElementById('lblVatMode').innerText = t.lblVatMode;
    document.getElementById('optExclusive').innerText = t.optExclusive;
    document.getElementById('optInclusive').innerText = t.optInclusive;
    document.getElementById('deductionsTitle').innerText = t.deductionsTitle;
    document.getElementById('lblMonthlyIncome').innerText = t.lblMonthlyIncome;
    document.getElementById('lblSpouseStatus').innerText = t.lblSpouseStatus;
    document.getElementById('optNoSpouse').innerText = t.optNoSpouse;
    document.getElementById('optHousewife').innerText = t.optHousewife;
    document.getElementById('lblChildren').innerText = t.lblChildren;
    document.getElementById('childrenHint').innerText = t.childrenHint;
    document.getElementById('lblOtherDependents').innerText = t.lblOtherDependents;
    document.getElementById('otherHint').innerText = t.otherHint;
    document.getElementById('lblStandardRelief').innerText = t.lblStandardRelief;
    document.getElementById('lblSpouseDeduction').innerText = t.lblSpouseDeduction;
    document.getElementById('lblChildrenDeduction').innerText = t.lblChildrenDeduction;
    document.getElementById('lblOtherDeduction').innerText = t.lblOtherDeduction;
    document.getElementById('lblTotalDeduction').innerText = t.lblTotalDeduction;
    document.getElementById('resultsTitle').innerText = t.resultsTitle;
    document.getElementById('resGrossAmount').innerText = t.resGrossAmount;
    document.getElementById('resTotalDeductions').innerText = t.resTotalDeductions;
    document.getElementById('resTaxableIncome').innerText = t.resTaxableIncome;
    document.getElementById('resTaxAmount').innerText = t.resTaxAmount;
    document.getElementById('resNetPayable').innerText = t.resNetPayable;
    
    const categorySelect = elements.taxCategory;
    categorySelect.options[0].text = t.vatLabel;
    categorySelect.options[1].text = t.salaryLabel;
    categorySelect.options[2].text = t.whtLabel;
    categorySelect.options[3].text = t.propertyLabel;
    
    updateDeductionSummary();
    calculate();
}

elements.taxCategory.addEventListener('change', () => {
    updateCategoryVisibility();
    calculate();
});

elements.monthlySalary.addEventListener('input', () => {
    updateDeductionSummary();
    calculate();
});

elements.spouseStatus.addEventListener('change', () => {
    updateDeductionSummary();
    calculate();
});

elements.childrenCount.addEventListener('input', () => {
    updateDeductionSummary();
    calculate();
});

elements.otherDependents.addEventListener('input', () => {
    updateDeductionSummary();
    calculate();
});

elements.baseAmount.addEventListener('input', calculate);
document.querySelectorAll('input[name="vatMode"]').forEach(radio => {
    radio.addEventListener('change', calculate);
});

elements.calculateBtn.addEventListener('click', calculate);

document.getElementById('btnEn').addEventListener('click', () => {
    currentLanguage = 'en';
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnEn').classList.add('active');
    updateLanguage();
});

document.getElementById('btnKh').addEventListener('click', () => {
    currentLanguage = 'kh';
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnKh').classList.add('active');
    updateLanguage();
});

document.getElementById('btnGov').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'government');
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnGov').classList.add('active');
});

document.getElementById('btnDigital').addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', 'digital');
    document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btnDigital').classList.add('active');
});

// Initialize
loadTranslations();