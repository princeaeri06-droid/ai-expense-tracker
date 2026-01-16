export const mockExpenses = [
  {
    id: '1',
    title: 'Groceries',
    amount: 120.45,
    category: 'Food',
    date: '2025-11-01',
    description: 'Weekly grocery run',
  },
  {
    id: '2',
    title: 'Utilities',
    amount: 85.0,
    category: 'Bills',
    date: '2025-11-03',
    description: 'Electric + water',
  },
  {
    id: '3',
    title: 'Gym membership',
    amount: 45,
    category: 'Health',
    date: '2025-11-05',
    description: 'Monthly subscription',
  },
  {
    id: '4',
    title: 'Coffee with friends',
    amount: 25.5,
    category: 'Social',
    date: '2025-11-06',
    description: 'Cafe meetup',
  },
  {
    id: '5',
    title: 'Streaming services',
    amount: 30,
    category: 'Entertainment',
    date: '2025-11-08',
    description: 'Monthly bundle',
  },
  {
    id: '6',
    title: 'Team lunch',
    amount: 150.0,
    category: 'Work',
    date: '2025-11-10',
    description: 'Client debrief at rooftop cafe',
  },
]

export const monthlySeries = [
  { month: 'May', total: 540 },
  { month: 'Jun', total: 610 },
  { month: 'Jul', total: 580 },
  { month: 'Aug', total: 650 },
  { month: 'Sep', total: 620 },
  { month: 'Oct', total: 670 },
  { month: 'Nov', total: 705 },
]

export const categorySplit = [
  { name: 'Food', value: 320, color: '#38bdf8' },
  { name: 'Bills', value: 220, color: '#fbbf24' },
  { name: 'Travel', value: 180, color: '#f472b6' },
  { name: 'Shopping', value: 140, color: '#22d3ee' },
  { name: 'Other', value: 95, color: '#c084fc' },
]

export const upcomingBills = [
  { id: 'b1', title: 'Internet subscription', dueDate: '2025-11-20', amount: 65 },
  { id: 'b2', title: 'Coworking space', dueDate: '2025-11-22', amount: 240 },
  { id: 'b3', title: 'Fitness membership', dueDate: '2025-11-25', amount: 45 },
]

export const aiSuggestions = [
  {
    id: 's1',
    title: 'Shift grocery budget',
    detail: 'Your Food category is trending +12% MoM. Consider moving ₹6,640 from Shopping.',
    impact: 'High impact',
  },
  {
    id: 's2',
    title: 'Negotiate utility plan',
    detail: 'Utilities spend has stayed above target for 3 months. Ask provider about energy saver plans.',
    impact: 'Medium impact',
  },
  {
    id: 's3',
    title: 'Automate travel savings',
    detail: 'Schedule a ₹12,450 monthly transfer to the travel fund to smooth out peaks.',
    impact: 'Quick win',
  },
]

