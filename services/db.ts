
import { User, Transaction } from '../types';

/**
 * Service to simulate a real database using localStorage.
 * Handles Single User persistence and Data initialization.
 */

const DB_USER_KEY = 'finanza_single_user';
const DB_TRANSACTIONS_KEY = 'finanza_transactions';

// Helper to simulate processing time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  
  /**
   * Initialize a new single user and generate initial data
   */
  async initSingleUser(name: string, avatar: string, recurringItems: any[]): Promise<User> {
    await delay(1500); // Simulate "Initializing System"

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email: 'user@local.app', // Internal identifier
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`,
    };

    localStorage.setItem(DB_USER_KEY, JSON.stringify(newUser));

    // Generate Transactions based on recurring items
    // We will generate 3 months of history including current month
    const transactions: Transaction[] = [];
    const today = new Date();
    
    // Loop through 0 (current), 1 (last month), 2 (2 months ago)
    for (let i = 0; i < 3; i++) {
      
      recurringItems.forEach((item: any) => {
         // Determine day of month. Use user selection if available, else random.
         let day = item.dayOfMonth ? item.dayOfMonth : (Math.floor(Math.random() * 20) + 1);
         
         // Create date object for that specific year/month
         const targetDate = new Date(today.getFullYear(), today.getMonth() - i, day);
         
         // Handle month overflow (e.g. Feb 30 -> Mar 2). 
         // If overflow happens, clamp to last day of that month.
         if (targetDate.getMonth() !== ((today.getMonth() - i + 12) % 12)) {
             // Reset to last day of previous (intended) month
             targetDate.setDate(0); 
         }

         const dateStr = targetDate.toISOString().split('T')[0];
         
         // Only add if it's not in the future relative to "today" (optional check, but good for realism)
         // Actually, if it's "recurring", it might happen later this month. 
         // For onboarding, let's include it if it's this month, even if technically "tomorrow", 
         // so the user sees the projection/plan.
         
         transactions.push({
           id: `${item.id}_${i}_${Math.random()}`,
           description: item.label,
           amount: item.amount,
           type: item.type,
           category: item.category,
           date: dateStr
         });
      });
    }

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    localStorage.setItem(DB_TRANSACTIONS_KEY, JSON.stringify(transactions));
    
    return newUser;
  },

  /**
   * Update user details
   */
  async updateUserProfile(email: string, updatedUser: User): Promise<void> {
    localStorage.setItem(DB_USER_KEY, JSON.stringify(updatedUser));
  },

  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    const userStr = localStorage.getItem(DB_USER_KEY);
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  /**
   * Reset App (Logout)
   */
  logout() {
    localStorage.removeItem(DB_USER_KEY);
    // Optional: Keep transactions? Or delete?
    // prompt implies single user app, usually means reset.
    // Let's NOT delete transactions by default to be safe, or maybe we should?
    // For a "reset" experience, we probably should.
    // But "Logout" might just mean "Lock".
    // Given the prompt "app solo para un usuario", let's assume Logout = Reset for demo purposes so they can start over.
    localStorage.removeItem(DB_TRANSACTIONS_KEY);
  },

  /**
   * Get Transactions
   */
  async getTransactions(): Promise<Transaction[]> {
    const stored = localStorage.getItem(DB_TRANSACTIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  /**
   * Save Transactions
   */
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    localStorage.setItem(DB_TRANSACTIONS_KEY, JSON.stringify(transactions));
  },

  // Stub methods to satisfy any lingering imports if needed (though we cleaned them up)
  async getUserTransactions(email: string) { return this.getTransactions(); },
  async saveUserTransactions(email: string, tx: Transaction[]) { return this.saveTransactions(tx); }
};
