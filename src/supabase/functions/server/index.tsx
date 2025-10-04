import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Health check endpoint
app.get("/make-server-c4c7235f/health", (c) => {
  return c.json({ status: "ExpenseManager API is running" });
});

// Initialize demo data
app.post("/make-server-c4c7235f/setup", async (c) => {
  try {
    console.log('Setting up expense management demo data...');
    
    // Create demo company
    const companyData = {
      id: 'demo-company-001',
      name: 'Demo Corporation',
      country: 'United States',
      currency: 'USD',
      created_at: new Date().toISOString()
    };
    
    await kv.set('company:demo-company-001', companyData);
    
    // Create demo users
    const users = [
      {
        id: 'admin-001',
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'admin',
        company_id: 'demo-company-001',
        is_manager_approver: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'manager-001',
        email: 'manager@company.com',
        name: 'Manager User',
        role: 'manager',
        company_id: 'demo-company-001',
        is_manager_approver: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'employee-001',
        email: 'employee@company.com',
        name: 'Employee User',
        role: 'employee',
        company_id: 'demo-company-001',
        manager_id: 'manager-001',
        is_manager_approver: false,
        created_at: new Date().toISOString()
      }
    ];
    
    for (const user of users) {
      await kv.set(`user:${user.id}`, user);
      await kv.set(`user:email:${user.email}`, user.id);
    }
    
    // Create demo approval rules
    const approvalRules = [
      {
        id: 'rule-001',
        company_id: 'demo-company-001',
        type: 'specific',
        specific_approver_id: 'manager-001',
        created_at: new Date().toISOString()
      }
    ];
    
    for (const rule of approvalRules) {
      await kv.set(`approval_rule:${rule.id}`, rule);
    }
    
    // Create sample expenses
    const sampleExpenses = [
      {
        id: 'expense-001',
        employee_id: 'employee-001',
        amount: 50.00,
        currency: 'USD',
        amount_in_company_currency: 50.00,
        category: 'Meals & Entertainment',
        description: 'Team lunch meeting',
        date: '2024-01-15',
        status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        id: 'expense-002',
        employee_id: 'employee-001',
        amount: 120.00,
        currency: 'USD',
        amount_in_company_currency: 120.00,
        category: 'Transportation',
        description: 'Uber to client meeting',
        date: '2024-01-16',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    
    for (const expense of sampleExpenses) {
      await kv.set(`expense:${expense.id}`, expense);
    }
    
    return c.json({ 
      message: 'Demo data setup completed successfully',
      company: companyData,
      users: users.map(u => ({ id: u.id, email: u.email, role: u.role })),
      credentials: {
        admin: 'admin@company.com / admin123',
        manager: 'manager@company.com / manager123',
        employee: 'employee@company.com / employee123'
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    return c.json({ error: 'Failed to setup demo data' }, 500);
  }
});

// Currency conversion endpoint
app.get("/make-server-c4c7235f/convert/:from/:to/:amount", async (c) => {
  try {
    const { from, to, amount } = c.req.param();
    
    // Demo conversion rates - in production, use a real currency API
    const conversionRates: Record<string, Record<string, number>> = {
      'USD': { 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110, 'USD': 1 },
      'EUR': { 'USD': 1.18, 'GBP': 0.86, 'JPY': 129, 'EUR': 1 },
      'GBP': { 'USD': 1.37, 'EUR': 1.16, 'JPY': 151, 'GBP': 1 },
      'JPY': { 'USD': 0.0091, 'EUR': 0.0077, 'GBP': 0.0066, 'JPY': 1 }
    };
    
    const rate = conversionRates[from]?.[to] || 1;
    const convertedAmount = Math.round(parseFloat(amount) * rate * 100) / 100;
    
    return c.json({
      originalAmount: parseFloat(amount),
      convertedAmount,
      fromCurrency: from,
      toCurrency: to,
      rate
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    return c.json({ error: 'Failed to convert currency' }, 500);
  }
});

// Get user by email (for authentication)
app.get("/make-server-c4c7235f/user/:email", async (c) => {
  try {
    const { email } = c.req.param();
    const userId = await kv.get(`user:email:${email}`);
    
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const user = await kv.get(`user:${userId}`);
    return c.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Get expenses for user
app.get("/make-server-c4c7235f/expenses/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const expenseKeys = await kv.getByPrefix('expense:');
    const expenses = expenseKeys.filter(expense => expense.employee_id === userId);
    
    // Sort by created_at descending
    expenses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return c.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    return c.json({ error: 'Failed to fetch expenses' }, 500);
  }
});

// Create new expense
app.post("/make-server-c4c7235f/expenses", async (c) => {
  try {
    const expenseData = await c.req.json();
    const expenseId = `expense-${Date.now()}`;
    
    const expense = {
      id: expenseId,
      ...expenseData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    await kv.set(`expense:${expenseId}`, expense);
    
    // Create approval step if user has a manager
    const user = await kv.get(`user:${expenseData.employee_id}`);
    if (user && user.manager_id) {
      const approvalStepId = `approval-${Date.now()}`;
      const approvalStep = {
        id: approvalStepId,
        expense_id: expenseId,
        approver_id: user.manager_id,
        status: 'pending',
        sequence: 1,
        created_at: new Date().toISOString()
      };
      
      await kv.set(`approval_step:${approvalStepId}`, approvalStep);
    }
    
    return c.json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    return c.json({ error: 'Failed to create expense' }, 500);
  }
});

// Get pending approvals for user
app.get("/make-server-c4c7235f/approvals/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const approvalKeys = await kv.getByPrefix('approval_step:');
    const pendingApprovals = approvalKeys.filter(step => 
      step.approver_id === userId && step.status === 'pending'
    );
    
    // Fetch expense details for each approval
    const approvalsWithExpenses = await Promise.all(
      pendingApprovals.map(async (approval) => {
        const expense = await kv.get(`expense:${approval.expense_id}`);
        const employee = await kv.get(`user:${expense?.employee_id}`);
        return {
          ...approval,
          expense: {
            ...expense,
            employee
          }
        };
      })
    );
    
    return c.json(approvalsWithExpenses);
  } catch (error) {
    console.error('Get approvals error:', error);
    return c.json({ error: 'Failed to fetch approvals' }, 500);
  }
});

// Process approval
app.post("/make-server-c4c7235f/approvals/:approvalId", async (c) => {
  try {
    const { approvalId } = c.req.param();
    const { status, comments } = await c.req.json();
    
    const approval = await kv.get(`approval_step:${approvalId}`);
    if (!approval) {
      return c.json({ error: 'Approval not found' }, 404);
    }
    
    // Update approval step
    const updatedApproval = {
      ...approval,
      status,
      comments: comments || null,
      decided_at: new Date().toISOString()
    };
    
    await kv.set(`approval_step:${approvalId}`, updatedApproval);
    
    // Update expense status
    const expense = await kv.get(`expense:${approval.expense_id}`);
    if (expense) {
      const updatedExpense = {
        ...expense,
        status
      };
      await kv.set(`expense:${approval.expense_id}`, updatedExpense);
    }
    
    return c.json(updatedApproval);
  } catch (error) {
    console.error('Process approval error:', error);
    return c.json({ error: 'Failed to process approval' }, 500);
  }
});

// OCR receipt processing endpoint
app.post("/make-server-c4c7235f/ocr/process-receipt", async (c) => {
  try {
    // Simulate OCR processing for demo
    // In production, integrate with Tesseract.js or Google Vision API
    const vendors = ['Starbucks', 'Uber Eats', 'Office Depot', 'Amazon', 'Target', 'Walmart', 'McDonald\'s', 'Subway'];
    const categories = ['food', 'transportation', 'office_supplies', 'software', 'travel', 'entertainment'];
    
    const extractedData = {
      amount: Math.round((Math.random() * 200 + 10) * 100) / 100,
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      description: 'Receipt processed via OCR',
      confidence: Math.round((Math.random() * 20 + 80) * 100) / 100
    };
    
    return c.json({
      success: true,
      data: extractedData,
      rawText: `Sample receipt text for ${extractedData.vendor}`
    });
  } catch (error) {
    console.error('OCR error:', error);
    return c.json({ 
      success: false, 
      error: 'OCR processing failed' 
    }, 500);
  }
});

// Company management endpoints
app.get("/make-server-c4c7235f/company", async (c) => {
  try {
    const companies = await kv.getByPrefix('company:');
    return c.json(companies[0] || null);
  } catch (error) {
    console.error('Get company error:', error);
    return c.json({ error: 'Failed to fetch company' }, 500);
  }
});

app.post("/make-server-c4c7235f/company", async (c) => {
  try {
    const companyData = await c.req.json();
    const companyId = `company-${Date.now()}`;
    
    const company = {
      id: companyId,
      ...companyData,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`company:${companyId}`, company);
    return c.json(company);
  } catch (error) {
    console.error('Create company error:', error);
    return c.json({ error: 'Failed to create company' }, 500);
  }
});

// User management endpoints
app.get("/make-server-c4c7235f/users", async (c) => {
  try {
    const users = await kv.getByPrefix('user:');
    const filteredUsers = users.filter(user => user.id && !user.id.includes('email:'));
    return c.json(filteredUsers);
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.post("/make-server-c4c7235f/users", async (c) => {
  try {
    const userData = await c.req.json();
    const userId = `user-${Date.now()}`;
    
    const user = {
      id: userId,
      ...userData,
      companyId: 'demo-company-001', // Default company for demo
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`user:${userId}`, user);
    await kv.set(`user:email:${userData.email}`, userId);
    
    return c.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.delete("/make-server-c4c7235f/users/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    await kv.del(`user:${userId}`);
    await kv.del(`user:email:${user.email}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Approval rules management
app.get("/make-server-c4c7235f/approval-rules", async (c) => {
  try {
    const rules = await kv.getByPrefix('approval_rule:');
    return c.json(rules);
  } catch (error) {
    console.error('Get approval rules error:', error);
    return c.json({ error: 'Failed to fetch approval rules' }, 500);
  }
});

app.post("/make-server-c4c7235f/approval-rules", async (c) => {
  try {
    const ruleData = await c.req.json();
    const ruleId = `rule-${Date.now()}`;
    
    const rule = {
      id: ruleId,
      ...ruleData,
      companyId: 'demo-company-001', // Default company for demo
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`approval_rule:${ruleId}`, rule);
    return c.json(rule);
  } catch (error) {
    console.error('Create approval rule error:', error);
    return c.json({ error: 'Failed to create approval rule' }, 500);
  }
});

// Enhanced currency conversion with external API simulation
app.get("/make-server-c4c7235f/currencies", async (c) => {
  try {
    // Simulate external API response
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
      { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
    ];
    
    return c.json(currencies);
  } catch (error) {
    console.error('Get currencies error:', error);
    return c.json({ error: 'Failed to fetch currencies' }, 500);
  }
});

// Analytics endpoints
app.get("/make-server-c4c7235f/analytics/dashboard/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const user = await kv.get(`user:${userId}`);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const expenses = await kv.getByPrefix('expense:');
    const users = await kv.getByPrefix('user:');
    const approvals = await kv.getByPrefix('approval_step:');
    
    let userExpenses = [];
    let totalExpenses = 0;
    let pendingExpenses = 0;
    let approvedExpenses = 0;
    
    if (user.role === 'admin') {
      // Admin sees all expenses
      userExpenses = expenses;
    } else if (user.role === 'manager') {
      // Manager sees their team's expenses
      const teamMembers = users.filter(u => u.manager_id === userId);
      const teamIds = teamMembers.map(m => m.id);
      userExpenses = expenses.filter(e => teamIds.includes(e.employee_id));
    } else {
      // Employee sees only their expenses
      userExpenses = expenses.filter(e => e.employee_id === userId);
    }
    
    userExpenses.forEach(expense => {
      totalExpenses += expense.amount || 0;
      if (expense.status === 'pending') pendingExpenses++;
      if (expense.status === 'approved') approvedExpenses++;
    });
    
    const pendingApprovals = approvals.filter(a => 
      a.approver_id === userId && a.status === 'pending'
    ).length;
    
    return c.json({
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      expenseCount: userExpenses.length,
      pendingExpenses,
      approvedExpenses,
      pendingApprovals,
      recentExpenses: userExpenses
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

Deno.serve(app.fetch);