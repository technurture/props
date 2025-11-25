import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
      avatar?: string;
      branch: any;
      assignedBranch?: any;
    } & DefaultSession["user"];
  }
  
  interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    role: string;
    branch: any;
    assignedBranch?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    branch: any;
    assignedBranch?: any;
    lastRefresh?: number;
  }
}
