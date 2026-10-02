import { auth } from './firebase.ts';
import { UserCloudData } from '../types.ts';

export interface DbHealthStatus {
  status: string;
  engine: string;
  timestamp: string;
}

/**
 * Get current Firebase Auth ID token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (err) {
    console.warn('Could not retrieve Firebase Auth token:', err);
    return null;
  }
}

/**
 * Check PostgreSQL / Supabase Cloud SQL database status
 */
export async function checkDatabaseHealth(): Promise<DbHealthStatus | null> {
  try {
    const res = await fetch('/api/db/health');
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.warn('Database health check notice:', err);
    return null;
  }
}

/**
 * Sync entire application data to PostgreSQL / Supabase
 */
export async function syncDataToCloudSql(data: UserCloudData): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      // User not logged in yet via Firebase Auth
      return false;
    }

    const res = await fetch('/api/db/sync-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json = await res.json();
      return json.success === true;
    }
    return false;
  } catch (err) {
    console.warn('Sync to Cloud SQL / Supabase notice:', err);
    return false;
  }
}

/**
 * Load entire application data from PostgreSQL / Supabase
 */
export async function loadDataFromCloudSql(): Promise<UserCloudData | null> {
  try {
    const token = await getAuthToken();
    if (!token) return null;

    const res = await fetch('/api/db/load-all', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const json = await res.json();
      return json.data || null;
    }
    return null;
  } catch (err) {
    console.warn('Load from Cloud SQL / Supabase notice:', err);
    return null;
  }
}
