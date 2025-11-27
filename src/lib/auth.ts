import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './dbConnect';
import User from '@/models/User';

/**
 * Auto-detect and configure the NextAuth URL for session cookies
 * 
 * This ensures session cookies work correctly across different environments:
 * - Development (Replit): Uses REPLIT_DEV_DOMAIN to construct the URL
 * - Production: Uses the explicitly set NEXTAUTH_URL environment variable
 * 
 * The auto-detection prevents hardcoded URLs from breaking authentication
 * when the domain changes (e.g., different Replit domains).
 */
const currentUrl = process.env.NEXTAUTH_URL;
const isLocalhost = !currentUrl || currentUrl.includes('localhost') || currentUrl === '';

if (process.env.REPLIT_DEV_DOMAIN && isLocalhost) {
  process.env.NEXTAUTH_URL = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  console.log(`[NextAuth] Auto-detected URL: ${process.env.NEXTAUTH_URL}`);
}

export const authOptions: NextAuthOptions = {
  /**
   * Trust the host header for dynamic domain support
   * 
   * This is critical for cloud environments (like Replit) where:
   * - The domain may change between deployments
   * - Multiple domains may point to the same application
   * - Session cookies need to be set for the correct domain
   * 
   * With trustHost enabled, NextAuth will:
   * - Use the Host header from incoming requests
   * - Generate correct callback URLs automatically
   * - Set session cookies for the actual domain being accessed
   * 
   * Note: trustHost is supported in NextAuth 4.24+, but TypeScript types may not reflect this
   */
  // @ts-expect-error - trustHost is valid in NextAuth 4.24+ but not in type definitions
  trustHost: true,
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email })
          .populate('branchId')
          .populate('assignedBranch')
          .select('+password');

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.getFullName(),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          branch: user.branchId,
          assignedBranch: user.assignedBranch,
          profileImage: user.profileImage,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // TTL for token refresh (5 minutes in milliseconds)
      const TOKEN_REFRESH_TTL = 5 * 60 * 1000;
      
      if (user) {
        // Initial login - set all user data from authorize callback
        token.id = user.id;
        token.role = user.role;
        token.branch = user.branch;
        token.assignedBranch = user.assignedBranch;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.profileImage = user.profileImage;
        token.lastRefresh = Date.now();
      } else if (token.id) {
        // Subsequent requests - refresh branch data if token is stale
        const now = Date.now();
        const lastRefresh = (token.lastRefresh as number) || 0;
        const shouldRefresh = now - lastRefresh > TOKEN_REFRESH_TTL;
        
        if (shouldRefresh) {
          try {
            await dbConnect();
            const freshUser = await User.findById(token.id)
              .populate('branchId')
              .populate('assignedBranch')
              .select('branchId assignedBranch role isActive');
            
            if (!freshUser) {
              // User has been deleted - invalidate token
              console.log('[JWT Callback] User not found, invalidating session');
              return null as any;
            }
            
            if (!freshUser.isActive) {
              // User has been deactivated - invalidate token
              console.log('[JWT Callback] User is inactive, invalidating session');
              return null as any;
            }
            
            // Update token with fresh data
            token.branch = freshUser.branchId;
            token.assignedBranch = freshUser.assignedBranch;
            token.role = freshUser.role;
            token.lastRefresh = now;
          } catch (error) {
            console.error('[JWT Callback] Error refreshing user data:', error);
            // Keep existing token data on error
          }
        }
      }
      
      if (trigger === 'update' && session) {
        if (session.profileImage !== undefined) {
          token.profileImage = session.profileImage;
        }
        if (session.firstName) {
          token.firstName = session.firstName;
        }
        if (session.lastName) {
          token.lastName = session.lastName;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branch = token.branch as any;
        session.user.assignedBranch = token.assignedBranch as any;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.profileImage = token.profileImage as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
