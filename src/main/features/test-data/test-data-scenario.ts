import type {
  AccountScenario,
  BudgetTemplate,
  CategoryLinkTemplate,
  ScenarioBudgetMonthContext,
  ScenarioMonthContext,
} from './test-data-types';

function isWinterMonth(month: number): boolean {
  return month === 12 || month === 1 || month === 2;
}

function isSummerMonth(month: number): boolean {
  return month >= 6 && month <= 8;
}

function currentAccountBudgets(): BudgetTemplate[] {
  return [
    { categoryKey: 'salary', amount: () => 3650 },
    { categoryKey: 'freelance', amount: ({ month }) => (month % 2 === 0 ? 280 : 0) },
    { categoryKey: 'rent', amount: () => 1350 },
    { categoryKey: 'utilities', amount: ({ month }) => (isWinterMonth(month) ? 138 : 112) },
    { categoryKey: 'broadband', amount: () => 42 },
    { categoryKey: 'insurance', amount: () => 65 },
    { categoryKey: 'savings_transfer', amount: () => 450 },
    { categoryKey: 'credit_card_payment', amount: () => 620 },
    { categoryKey: 'groceries', amount: ({ month }) => (month === 12 ? 410 : 355) },
    { categoryKey: 'eating_out', amount: () => 145 },
    { categoryKey: 'transport', amount: ({ month }) => (isSummerMonth(month) ? 95 : 120) },
    { categoryKey: 'shopping', amount: ({ month }) => (month === 12 ? 155 : 105) },
    { categoryKey: 'entertainment', amount: () => 28 },
    { categoryKey: 'cashback', amount: () => 8 },
    { categoryKey: 'refunds', amount: ({ month }) => (month % 4 === 0 ? 20 : 0) },
  ];
}

function savingsAccountBudgets(): BudgetTemplate[] {
  return [
    { categoryKey: 'monthly_transfer', amount: () => 450 },
    { categoryKey: 'holiday_booking', amount: ({ month }) => (isSummerMonth(month) ? 240 : 0) },
    { categoryKey: 'home_repair', amount: ({ month }) => (month % 6 === 0 ? 120 : 0) },
    { categoryKey: 'interest_earned', amount: ({ offsetFromCurrent }) => 7 + Math.max(0, offsetFromCurrent + 3) },
  ];
}

function creditAccountBudgets(): BudgetTemplate[] {
  return [
    { categoryKey: 'card_payment', amount: () => 620 },
    { categoryKey: 'fuel', amount: () => 78 },
    { categoryKey: 'software', amount: () => 20 },
    { categoryKey: 'mobile', amount: () => 24 },
    { categoryKey: 'dining', amount: () => 120 },
    { categoryKey: 'travel', amount: ({ month }) => (isSummerMonth(month) ? 145 : 85) },
    { categoryKey: 'online_shopping', amount: ({ month }) => (month === 11 || month === 12 ? 130 : 92) },
    { categoryKey: 'home_goods', amount: ({ month }) => (month % 3 === 0 ? 75 : 35) },
    { categoryKey: 'refunds', amount: ({ month }) => (month % 5 === 0 ? 12 : 0) },
  ];
}

function monthOffsetMatch(context: ScenarioMonthContext, offset: number): boolean {
  return context.offsetFromCurrent === offset;
}

export const TEST_DATA_SCENARIOS: AccountScenario[] = [
  {
    key: 'current',
    account: {
      name: 'Everyday Current (Sample)',
      icon: '🏦',
      type: 'current',
      openingBalance: 2840,
    },
    headers: [
      {
        name: 'Income',
        type: 'income_start',
        colour: '#22c55e',
        categories: [
          { key: 'salary', name: 'Salary' },
          { key: 'freelance', name: 'Freelance Work' },
        ],
      },
      {
        name: 'Household Bills',
        type: 'fixed_expense',
        colour: '#ef4444',
        categories: [
          { key: 'rent', name: 'Rent' },
          { key: 'utilities', name: 'Utilities' },
          { key: 'broadband', name: 'Broadband' },
          { key: 'insurance', name: 'Insurance' },
          { key: 'savings_transfer', name: 'Savings Transfer' },
          { key: 'credit_card_payment', name: 'Credit Card Payment' },
        ],
      },
      {
        name: 'Everyday Spending',
        type: 'variable_expense',
        colour: '#f59e0b',
        categories: [
          { key: 'groceries', name: 'Groceries' },
          { key: 'eating_out', name: 'Eating Out' },
          { key: 'transport', name: 'Transport' },
          { key: 'shopping', name: 'Shopping' },
          { key: 'entertainment', name: 'Entertainment' },
        ],
      },
      {
        name: 'Extras',
        type: 'income_end',
        colour: '#38bdf8',
        categories: [
          { key: 'cashback', name: 'Cashback' },
          { key: 'refunds', name: 'Refunds' },
        ],
      },
    ],
    rules: [
      { categoryKey: 'salary', data: { category_id: '', match_text: 'ACME PAYROLL', match_type: 'contains', min_amount: 3000, max_amount: null } },
      { categoryKey: 'freelance', data: { category_id: '', match_text: 'HARBOR STUDIO', match_type: 'contains', min_amount: 100, max_amount: null } },
      { categoryKey: 'rent', data: { category_id: '', match_text: 'KINGS COURT RENT', match_type: 'contains', min_amount: 1000, max_amount: null } },
      { categoryKey: 'utilities', data: { category_id: '', match_text: 'OCTOPUS ENERGY', match_type: 'contains', min_amount: 80, max_amount: 180 } },
      { categoryKey: 'broadband', data: { category_id: '', match_text: 'COMMUNITY FIBRE', match_type: 'contains', min_amount: 30, max_amount: 60 } },
      { categoryKey: 'insurance', data: { category_id: '', match_text: 'AVIVA HOME', match_type: 'contains', min_amount: 40, max_amount: 90 } },
      { categoryKey: 'savings_transfer', data: { category_id: '', match_text: 'TRANSFER TO RAINY DAY', match_type: 'contains', min_amount: 450, max_amount: 450 } },
      { categoryKey: 'credit_card_payment', data: { category_id: '', match_text: 'PAYMENT TO COPPER CARD', match_type: 'contains', min_amount: 600, max_amount: 650 } },
      { categoryKey: 'groceries', data: { category_id: '', match_text: 'TESCO', match_type: 'contains', min_amount: 20, max_amount: 120 } },
      { categoryKey: 'groceries', data: { category_id: '', match_text: 'SAINSBURYS', match_type: 'contains', min_amount: 20, max_amount: 120 } },
      { categoryKey: 'eating_out', data: { category_id: '', match_text: 'PRET', match_type: 'contains', min_amount: 3, max_amount: 30 } },
      { categoryKey: 'eating_out', data: { category_id: '', match_text: 'UBER EATS', match_type: 'contains', min_amount: 10, max_amount: 60 } },
      { categoryKey: 'transport', data: { category_id: '', match_text: 'TFL', match_type: 'contains', min_amount: 5, max_amount: 60 } },
      { categoryKey: 'transport', data: { category_id: '', match_text: 'TRAINLINE', match_type: 'contains', min_amount: 5, max_amount: 80 } },
      { categoryKey: 'shopping', data: { category_id: '', match_text: 'AMAZON', match_type: 'contains', min_amount: 10, max_amount: 150 } },
      { categoryKey: 'entertainment', data: { category_id: '', match_text: 'NETFLIX', match_type: 'contains', min_amount: 5, max_amount: 30 } },
      { categoryKey: 'entertainment', data: { category_id: '', match_text: 'SPOTIFY', match_type: 'contains', min_amount: 5, max_amount: 20 } },
      { categoryKey: 'cashback', data: { category_id: '', match_text: 'CHASE CASHBACK', match_type: 'contains', min_amount: 1, max_amount: 20 } },
      { categoryKey: 'refunds', data: { category_id: '', match_text: 'REFUND', match_type: 'contains', min_amount: 1, max_amount: 200 } },
    ],
    transactions: [
      { day: 1, description: 'ACME PAYROLL', amount: () => 3650 },
      { day: 2, description: 'KINGS COURT RENT', amount: () => -1350 },
      { day: 3, description: 'TESCO EXTRA', amount: ({ offsetFromCurrent }) => -(82 + offsetFromCurrent * 4) },
      { day: 4, description: 'TFL AUTO TOPUP', amount: ({ offsetFromCurrent }) => -(16.4 + offsetFromCurrent * 2.5) },
      { day: 5, description: 'OCTOPUS ENERGY', amount: ({ month }) => (isWinterMonth(month) ? -124 : -109) },
      { day: 6, description: 'COMMUNITY FIBRE', amount: () => -42 },
      { day: 7, description: 'PRET A MANGER', amount: ({ offsetFromCurrent }) => -(7.8 + offsetFromCurrent) },
      { day: 8, description: 'AVIVA HOME', amount: () => -65 },
      { day: 9, description: 'TRANSFER TO RAINY DAY', amount: () => -450 },
      { day: 10, description: 'PAYMENT TO COPPER CARD', amount: ({ offsetFromCurrent }) => -(620 + offsetFromCurrent * 15) },
      { day: 11, description: 'AMAZON UK RETAIL', amount: ({ offsetFromCurrent }) => -(34 + offsetFromCurrent * 18) },
      { day: 12, description: 'CHASE CASHBACK', amount: ({ offsetFromCurrent }) => 5.2 + offsetFromCurrent },
      { day: 14, description: 'HARBOR STUDIO', amount: ({ offsetFromCurrent }) => (offsetFromCurrent === 1 ? 540 : 0), include: (context) => monthOffsetMatch(context, 1) },
      { day: 16, description: 'SAINSBURYS LOCAL', amount: ({ offsetFromCurrent }) => -(54 + offsetFromCurrent * 5), include: (context) => context.offsetFromCurrent > 0 },
      { day: 18, description: 'UBER EATS', amount: ({ offsetFromCurrent }) => -(22 + offsetFromCurrent * 6), include: (context) => context.offsetFromCurrent > 0 },
      { day: 20, description: 'TRAINLINE', amount: ({ offsetFromCurrent }) => -(18 + offsetFromCurrent * 4), include: (context) => context.offsetFromCurrent > 0 },
      { day: 24, description: 'NETFLIX', amount: () => -15.99, include: (context) => context.offsetFromCurrent > 0 },
      { day: 26, description: 'SPOTIFY', amount: () => -11.99, include: (context) => context.offsetFromCurrent > 0 },
      { day: 27, description: 'REFUND - RUN CLUB', amount: ({ offsetFromCurrent }) => 18 + offsetFromCurrent * 3, include: (context) => monthOffsetMatch(context, 2) },
    ],
    budgets: currentAccountBudgets(),
  },
  {
    key: 'savings',
    account: {
      name: 'Rainy Day Saver (Sample)',
      icon: '💰',
      type: 'savings',
      openingBalance: 6800,
    },
    headers: [
      {
        name: 'Savings In',
        type: 'income_start',
        colour: '#22c55e',
        categories: [{ key: 'monthly_transfer', name: 'Monthly Transfer' }],
      },
      {
        name: 'Withdrawals',
        type: 'variable_expense',
        colour: '#f97316',
        categories: [
          { key: 'holiday_booking', name: 'Holiday Booking' },
          { key: 'home_repair', name: 'Home Repair' },
        ],
      },
      {
        name: 'Growth',
        type: 'income_end',
        colour: '#60a5fa',
        categories: [{ key: 'interest_earned', name: 'Interest Earned' }],
      },
    ],
    rules: [
      { categoryKey: 'monthly_transfer', data: { category_id: '', match_text: 'TRANSFER FROM EVERYDAY', match_type: 'contains', min_amount: 450, max_amount: 450 } },
      { categoryKey: 'holiday_booking', data: { category_id: '', match_text: 'HOLIDAY COTTAGE', match_type: 'contains', min_amount: 150, max_amount: 500 } },
      { categoryKey: 'home_repair', data: { category_id: '', match_text: 'TRANSFER TO EVERYDAY REPAIR', match_type: 'contains', min_amount: 100, max_amount: 400 } },
      { categoryKey: 'interest_earned', data: { category_id: '', match_text: 'SAVINGS INTEREST', match_type: 'contains', min_amount: 1, max_amount: 50 } },
    ],
    transactions: [
      { day: 10, description: 'TRANSFER FROM EVERYDAY', amount: () => 450 },
      { day: 19, description: 'HOLIDAY COTTAGE', amount: ({ offsetFromCurrent }) => -(320 + offsetFromCurrent * 20), include: (context) => monthOffsetMatch(context, 1) },
      { day: 23, description: 'TRANSFER TO EVERYDAY REPAIR', amount: ({ offsetFromCurrent }) => -(180 + offsetFromCurrent * 25), include: (context) => monthOffsetMatch(context, 2) },
      { day: 28, description: 'SAVINGS INTEREST', amount: ({ offsetFromCurrent }) => 6.5 + offsetFromCurrent * 0.7 },
    ],
    budgets: savingsAccountBudgets(),
  },
  {
    key: 'credit',
    account: {
      name: 'Copper Rewards Card (Sample)',
      icon: '💳',
      type: 'credit',
      openingBalance: -920,
    },
    headers: [
      {
        name: 'Payments',
        type: 'income_start',
        colour: '#22c55e',
        categories: [{ key: 'card_payment', name: 'Card Payment' }],
      },
      {
        name: 'Committed Spend',
        type: 'fixed_expense',
        colour: '#ef4444',
        categories: [
          { key: 'fuel', name: 'Fuel' },
          { key: 'software', name: 'Software' },
          { key: 'mobile', name: 'Mobile' },
        ],
      },
      {
        name: 'Card Spend',
        type: 'variable_expense',
        colour: '#f59e0b',
        categories: [
          { key: 'dining', name: 'Dining' },
          { key: 'travel', name: 'Travel' },
          { key: 'online_shopping', name: 'Online Shopping' },
          { key: 'home_goods', name: 'Home Goods' },
        ],
      },
      {
        name: 'Credits',
        type: 'income_end',
        colour: '#60a5fa',
        categories: [{ key: 'refunds', name: 'Refunds' }],
      },
    ],
    rules: [
      { categoryKey: 'card_payment', data: { category_id: '', match_text: 'PAYMENT RECEIVED', match_type: 'contains', min_amount: 550, max_amount: 700 } },
      { categoryKey: 'fuel', data: { category_id: '', match_text: 'SHELL', match_type: 'contains', min_amount: 30, max_amount: 120 } },
      { categoryKey: 'software', data: { category_id: '', match_text: 'ADOBE', match_type: 'contains', min_amount: 10, max_amount: 50 } },
      { categoryKey: 'mobile', data: { category_id: '', match_text: 'EE MOBILE', match_type: 'contains', min_amount: 10, max_amount: 40 } },
      { categoryKey: 'dining', data: { category_id: '', match_text: 'DISHOOM', match_type: 'contains', min_amount: 15, max_amount: 80 } },
      { categoryKey: 'travel', data: { category_id: '', match_text: 'TRAINLINE', match_type: 'contains', min_amount: 10, max_amount: 120 } },
      { categoryKey: 'online_shopping', data: { category_id: '', match_text: 'AMAZON MARKETPLACE', match_type: 'contains', min_amount: 10, max_amount: 180 } },
      { categoryKey: 'home_goods', data: { category_id: '', match_text: 'IKEA', match_type: 'contains', min_amount: 20, max_amount: 250 } },
      { categoryKey: 'refunds', data: { category_id: '', match_text: 'REFUND', match_type: 'contains', min_amount: 1, max_amount: 100 } },
    ],
    transactions: [
      { day: 4, description: 'SHELL HIGH ROAD', amount: ({ offsetFromCurrent }) => -(69 + offsetFromCurrent * 4) },
      { day: 6, description: 'ADOBE CREATIVE CLOUD', amount: () => -19.99 },
      { day: 7, description: 'EE MOBILE', amount: () => -24 },
      { day: 9, description: 'DISHOOM', amount: ({ offsetFromCurrent }) => -(31 + offsetFromCurrent * 7) },
      { day: 11, description: 'PAYMENT RECEIVED', amount: ({ offsetFromCurrent }) => 620 + offsetFromCurrent * 15 },
      { day: 16, description: 'AMAZON MARKETPLACE', amount: ({ offsetFromCurrent }) => -(46 + offsetFromCurrent * 15), include: (context) => context.offsetFromCurrent > 0 },
      { day: 20, description: 'TRAINLINE', amount: ({ offsetFromCurrent }) => -(18 + offsetFromCurrent * 22), include: (context) => context.offsetFromCurrent > 0 },
      { day: 22, description: 'IKEA', amount: ({ offsetFromCurrent }) => -(70 + offsetFromCurrent * 18), include: (context) => monthOffsetMatch(context, 2) },
      { day: 26, description: 'REFUND - HOME GOODS', amount: ({ offsetFromCurrent }) => 14 + offsetFromCurrent * 5, include: (context) => monthOffsetMatch(context, 1) },
    ],
    budgets: creditAccountBudgets(),
  },
];

export const TEST_DATA_CATEGORY_LINKS: CategoryLinkTemplate[] = [
  {
    sourceAccountKey: 'current',
    sourceCategoryKey: 'savings_transfer',
    targetAccountKey: 'savings',
    targetCategoryKey: 'monthly_transfer',
  },
  {
    sourceAccountKey: 'current',
    sourceCategoryKey: 'credit_card_payment',
    targetAccountKey: 'credit',
    targetCategoryKey: 'card_payment',
  },
];

export function getRecentTransactionMonths(now: Date): ScenarioMonthContext[] {
  return [-2, -1, 0].map((offsetFromCurrent) => {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() + offsetFromCurrent, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const dayLimit = offsetFromCurrent === 0
      ? now.getUTCDate()
      : new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
      year,
      month,
      offsetFromCurrent,
      dayLimit,
    };
  });
}

export function getBudgetMonths(now: Date): ScenarioBudgetMonthContext[] {
  const months: ScenarioBudgetMonthContext[] = [];

  for (let offsetFromCurrent = -3; offsetFromCurrent <= 12; offsetFromCurrent += 1) {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() + offsetFromCurrent, 1));

    months.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      offsetFromCurrent,
    });
  }

  return months;
}
