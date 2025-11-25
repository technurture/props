import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/emr';
import { Session } from 'next-auth';

export async function getServerSession(): Promise<Session | null> {
  try {
    const session = await getNextAuthSession(authOptions);
    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

export async function getUserFromSession() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
      branch: session.user.branch,
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.role) {
      return null;
    }

    return session.user.role as UserRole;
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}

export async function getCurrentUserBranch() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.branch) {
      return null;
    }

    return session.user.branch;
  } catch (error) {
    console.error('Error getting current user branch:', error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user || !session.user.id) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error('Error getting current user id:', error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getServerSession();
    return !!(session && session.user);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

export async function requireSession() {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized. Please log in.');
  }

  return session;
}

export async function requireUser() {
  const user = await getUserFromSession();
  
  if (!user) {
    throw new Error('Unauthorized. Please log in.');
  }

  return user;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branch: any;
}
