import axios from 'axios';
import { User, Customer, ChitScheme, Payment, Auction, LoginCredentials, RegisterData } from '../types';

// Update this URL to match your backend server
// For XAMPP/WAMP: http://localhost/chitfund-admin-portal/backend/api
// For PHP built-in server: http://localhost:8000/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Authentication
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login.php', credentials);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Login failed');
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register.php', data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Registration failed');
  },

  async logout(): Promise<void> {
    await api.get('/auth/logout.php');
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const response = await api.get('/customers/index.php');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch customers');
  },

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const response = await api.get(`/customers/get.php?id=${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    if (response.status === 404) {
      return undefined;
    }
    throw new Error(response.data.message || 'Failed to fetch customer');
  },

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const response = await api.post('/customers/index.php', customer);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to add customer');
  },

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer> {
    const response = await api.put(`/customers/update.php?id=${id}`, customer);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update customer');
  },

  async deleteCustomer(id: string): Promise<void> {
    const response = await api.delete(`/customers/delete.php?id=${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete customer');
    }
  },

  // Chit Schemes
  async getSchemes(): Promise<ChitScheme[]> {
    const response = await api.get('/schemes/index.php');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch schemes');
  },

  async getSchemeById(id: string): Promise<ChitScheme | undefined> {
    const response = await api.get(`/schemes/get.php?id=${id}`);
    if (response.data.success) {
      return response.data.data;
    }
    if (response.status === 404) {
      return undefined;
    }
    throw new Error(response.data.message || 'Failed to fetch scheme');
  },

  async addScheme(scheme: Omit<ChitScheme, 'id'>): Promise<ChitScheme> {
    const response = await api.post('/schemes/index.php', scheme);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create scheme');
  },

  async updateScheme(id: string, scheme: Partial<Omit<ChitScheme, 'id'>>): Promise<ChitScheme> {
    const response = await api.put(`/schemes/update.php?id=${id}`, scheme);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update scheme');
  },

  async deleteScheme(id: string): Promise<void> {
    const response = await api.delete(`/schemes/delete.php?id=${id}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete scheme');
    }
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    const response = await api.get('/payments/index.php');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch payments');
  },

  // Auctions
  async getAuctions(): Promise<Auction[]> {
    const response = await api.get('/auctions/index.php');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch auctions');
  },
};

