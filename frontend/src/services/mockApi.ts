import { User, Customer, ChitScheme, Payment, Auction, LoginCredentials, RegisterData } from '../types';

// Storage keys
const STORAGE_KEYS = {
  CUSTOMERS: 'chitfund_customers',
  SCHEMES: 'chitfund_schemes'
};

// Helper functions for localStorage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Default data
const defaultCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '9876543210',
    address: '123 Main Street, City',
    aadharNumber: '1234-5678-9012',
    panNumber: 'ABCDE1234F',
    createdAt: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543211',
    address: '456 Park Avenue, City',
    aadharNumber: '2345-6789-0123',
    panNumber: 'FGHIJ5678K',
    createdAt: '2024-01-20',
    status: 'active'
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    phone: '9876543212',
    address: '789 Market Road, City',
    aadharNumber: '3456-7890-1234',
    panNumber: 'LMNOP9012Q',
    createdAt: '2024-02-01',
    status: 'active'
  }
];

const defaultSchemes: ChitScheme[] = [
  {
    id: '1',
    name: 'Monthly Chit Scheme - 1 Lakh',
    totalAmount: 100000,
    duration: 12,
    monthlyInstallment: 8333,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    totalMembers: 20,
    currentMembers: 15
  },
  {
    id: '2',
    name: 'Monthly Chit Scheme - 5 Lakh',
    totalAmount: 500000,
    duration: 24,
    monthlyInstallment: 20833,
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    status: 'active',
    totalMembers: 25,
    currentMembers: 20
  },
  {
    id: '3',
    name: 'Monthly Chit Scheme - 2 Lakh',
    totalAmount: 200000,
    duration: 12,
    monthlyInstallment: 16666,
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'completed',
    totalMembers: 15,
    currentMembers: 15
  }
];

// Mock Users
const mockUsers: User[] = [
  { id: '1', username: 'admin', email: 'admin@chitfund.com', name: 'Admin User', role: 'admin' },
  { id: '2', username: 'manager', email: 'manager@chitfund.com', name: 'Manager User', role: 'manager' }
];

// Load data from localStorage or use defaults
let mockCustomers: Customer[] = loadFromStorage(STORAGE_KEYS.CUSTOMERS, defaultCustomers);
let mockSchemes: ChitScheme[] = loadFromStorage(STORAGE_KEYS.SCHEMES, defaultSchemes);

// Initialize localStorage with default data if empty
if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
  saveToStorage(STORAGE_KEYS.CUSTOMERS, defaultCustomers);
}
if (!localStorage.getItem(STORAGE_KEYS.SCHEMES)) {
  saveToStorage(STORAGE_KEYS.SCHEMES, defaultSchemes);
}

// Mock Payments
const mockPayments: Payment[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    schemeId: '1',
    schemeName: 'Monthly Chit Scheme - 1 Lakh',
    amount: 8333,
    paymentDate: '2024-01-05',
    month: 1,
    status: 'paid'
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Priya Sharma',
    schemeId: '1',
    schemeName: 'Monthly Chit Scheme - 1 Lakh',
    amount: 8333,
    paymentDate: '2024-01-06',
    month: 1,
    status: 'paid'
  },
  {
    id: '3',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    schemeId: '1',
    schemeName: 'Monthly Chit Scheme - 1 Lakh',
    amount: 8333,
    paymentDate: '2024-02-05',
    month: 2,
    status: 'paid'
  },
  {
    id: '4',
    customerId: '3',
    customerName: 'Amit Patel',
    schemeId: '2',
    schemeName: 'Monthly Chit Scheme - 5 Lakh',
    amount: 20833,
    paymentDate: '',
    month: 1,
    status: 'pending'
  }
];

// Mock Auctions
const mockAuctions: Auction[] = [
  {
    id: '1',
    schemeId: '1',
    schemeName: 'Monthly Chit Scheme - 1 Lakh',
    auctionDate: '2024-02-15',
    baseAmount: 100000,
    highestBid: 95000,
    winnerId: '1',
    winnerName: 'Rajesh Kumar',
    status: 'completed'
  },
  {
    id: '2',
    schemeId: '1',
    schemeName: 'Monthly Chit Scheme - 1 Lakh',
    auctionDate: '2024-03-15',
    baseAmount: 100000,
    highestBid: 0,
    status: 'scheduled'
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Authentication
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await delay(500);
    const user = mockUsers.find(u => u.username === credentials.username);
    if (user && credentials.password === 'password') {
      return { user, token: 'mock-token-' + user.id };
    }
    throw new Error('Invalid credentials');
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    await delay(500);
    const newUser: User = {
      id: String(mockUsers.length + 1),
      username: data.username,
      email: data.email,
      name: data.name,
      role: 'manager'
    };
    mockUsers.push(newUser);
    return { user: newUser, token: 'mock-token-' + newUser.id };
  },

  async logout(): Promise<void> {
    await delay(300);
    return Promise.resolve();
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    await delay(500);
    // Reload from localStorage to ensure we have latest data
    mockCustomers = loadFromStorage(STORAGE_KEYS.CUSTOMERS, defaultCustomers);
    return [...mockCustomers];
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    await delay(500);
    // Generate unique ID based on highest existing ID
    const maxId = mockCustomers.reduce((max, c) => {
      const numId = parseInt(c.id) || 0;
      return numId > max ? numId : max;
    }, 0);
    const newCustomer: Customer = {
      ...customer,
      id: String(maxId + 1),
      createdAt: new Date().toISOString().split('T')[0]
    };
    mockCustomers.push(newCustomer);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, mockCustomers);
    return newCustomer;
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    await delay(300);
    return mockCustomers.find(c => c.id === id);
  },

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> {
    await delay(500);
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    mockCustomers[index] = { ...mockCustomers[index], ...customer };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, mockCustomers);
    return mockCustomers[index];
  },

  async deleteCustomer(id: string): Promise<void> {
    await delay(500);
    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    mockCustomers.splice(index, 1);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, mockCustomers);
  },

  // Chit Schemes
  async getSchemes(): Promise<ChitScheme[]> {
    await delay(500);
    // Reload from localStorage to ensure we have latest data
    mockSchemes = loadFromStorage(STORAGE_KEYS.SCHEMES, defaultSchemes);
    return [...mockSchemes];
  },

  async addScheme(scheme: Omit<ChitScheme, 'id'>): Promise<ChitScheme> {
    await delay(500);
    // Generate unique ID based on highest existing ID
    const maxId = mockSchemes.reduce((max, s) => {
      const numId = parseInt(s.id) || 0;
      return numId > max ? numId : max;
    }, 0);
    const newScheme: ChitScheme = {
      ...scheme,
      id: String(maxId + 1)
    };
    mockSchemes.push(newScheme);
    saveToStorage(STORAGE_KEYS.SCHEMES, mockSchemes);
    return newScheme;
  },

  async getSchemeById(id: string): Promise<ChitScheme | undefined> {
    await delay(300);
    return mockSchemes.find(s => s.id === id);
  },

  async updateScheme(id: string, scheme: Partial<Omit<ChitScheme, 'id'>>): Promise<ChitScheme> {
    await delay(500);
    const index = mockSchemes.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Scheme not found');
    }
    mockSchemes[index] = { ...mockSchemes[index], ...scheme };
    saveToStorage(STORAGE_KEYS.SCHEMES, mockSchemes);
    return mockSchemes[index];
  },

  async deleteScheme(id: string): Promise<void> {
    await delay(500);
    const index = mockSchemes.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Scheme not found');
    }
    mockSchemes.splice(index, 1);
    saveToStorage(STORAGE_KEYS.SCHEMES, mockSchemes);
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    await delay(500);
    return [...mockPayments];
  },

  // Auctions
  async getAuctions(): Promise<Auction[]> {
    await delay(500);
    return [...mockAuctions];
  }
};

