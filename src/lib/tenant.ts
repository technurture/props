import { headers } from 'next/headers';
import dbConnect from './dbConnect';
import Tenant, { ITenant } from '@/models/Tenant';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'medvault.app';
const MARKETING_HOSTS = [
  'localhost',
  '127.0.0.1',
  ROOT_DOMAIN,
  `www.${ROOT_DOMAIN}`,
];

export interface TenantContext {
  tenant: ITenant | null;
  tenantId: string | null;
  isMarketingSite: boolean;
}

export function extractSubdomain(host: string): string | null {
  const cleanHost = host.split(':')[0].toLowerCase();
  
  if (MARKETING_HOSTS.includes(cleanHost)) {
    return null;
  }
  
  if (cleanHost.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = cleanHost.replace(`.${ROOT_DOMAIN}`, '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
  }
  
  if (cleanHost.includes('.replit.dev') || cleanHost.includes('.repl.co')) {
    return null;
  }
  
  return cleanHost;
}

export async function resolveTenant(host: string): Promise<TenantContext> {
  const cleanHost = host.split(':')[0].toLowerCase();
  
  if (MARKETING_HOSTS.includes(cleanHost)) {
    return { tenant: null, tenantId: null, isMarketingSite: true };
  }
  
  if (cleanHost.includes('.replit.dev') || cleanHost.includes('.repl.co')) {
    return { tenant: null, tenantId: null, isMarketingSite: true };
  }
  
  await dbConnect();
  
  const subdomain = extractSubdomain(host);
  if (subdomain) {
    const tenant = await Tenant.findOne({ 
      slug: subdomain, 
      isActive: true 
    });
    
    if (tenant) {
      return { 
        tenant, 
        tenantId: tenant._id.toString(), 
        isMarketingSite: false 
      };
    }
  }
  
  const tenant = await Tenant.findOne({ 
    customDomains: cleanHost, 
    isActive: true 
  });
  
  if (tenant) {
    return { 
      tenant, 
      tenantId: tenant._id.toString(), 
      isMarketingSite: false 
    };
  }
  
  return { tenant: null, tenantId: null, isMarketingSite: true };
}

export async function getTenantFromRequest(): Promise<TenantContext> {
  const headersList = await headers();
  
  const tenantId = headersList.get('x-tenant-id');
  const isMarketingSite = headersList.get('x-is-marketing-site') === 'true';
  
  if (isMarketingSite) {
    return { tenant: null, tenantId: null, isMarketingSite: true };
  }
  
  if (tenantId) {
    await dbConnect();
    const tenant = await Tenant.findById(tenantId);
    return { 
      tenant, 
      tenantId, 
      isMarketingSite: false 
    };
  }
  
  const host = headersList.get('host') || headersList.get('x-forwarded-host') || '';
  return resolveTenant(host);
}

export function requireTenant(context: TenantContext): asserts context is TenantContext & { tenant: ITenant; tenantId: string } {
  if (!context.tenant || !context.tenantId) {
    throw new Error('Tenant context is required for this operation');
  }
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  await dbConnect();
  const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
  return !existing;
}

export function getTenantUrl(slug: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:5000`;
  }
  return `https://${slug}.${ROOT_DOMAIN}`;
}
