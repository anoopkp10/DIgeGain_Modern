import fs from 'fs/promises';
import path from 'path';
import { AppData, AppDataSchema, ContactData, PortfolioItem, LeadData, AssistantData, SettingsData } from './validators.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'appdata.json');
const BACKUP_FILE = path.join(DATA_DIR, 'appdata.backup.json');
const TEMP_FILE = path.join(DATA_DIR, 'appdata.tmp.json');
const EXAMPLE_FILE = path.join(DATA_DIR, 'appdata.example.json');

// Simple in-process mutex for serializing writes
let writeLock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeLock.then(fn);
  writeLock = next.then(() => {}, () => {});
  return next;
}

export async function readAppData(): Promise<AppData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = AppDataSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    console.warn('appdata.json schema mismatch, returning parsed with fallback:', validated.error);
    return parsed as AppData;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      try {
        const exampleRaw = await fs.readFile(EXAMPLE_FILE, 'utf-8');
        const exampleData = AppDataSchema.parse(JSON.parse(exampleRaw));
        await writeAppData(exampleData);
        return exampleData;
      } catch (backupErr) {
        console.error('Failed to load example appdata:', backupErr);
      }
    }
    throw err;
  }
}

export async function writeAppData(data: AppData): Promise<void> {
  return withLock(async () => {
    // Validate before writing
    const validated = AppDataSchema.parse(data);
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 1. Create rolling backup if current file exists
    try {
      await fs.copyFile(DATA_FILE, BACKUP_FILE);
    } catch {
      // File might not exist yet on initial run
    }

    // 2. Atomic write: write to temp file, then rename
    const jsonStr = JSON.stringify(validated, null, 2);
    await fs.writeFile(TEMP_FILE, jsonStr, 'utf-8');
    await fs.rename(TEMP_FILE, DATA_FILE);
  });
}

/* Helper methods for granular operations */

export async function getContact(): Promise<ContactData> {
  const data = await readAppData();
  return data.contact;
}

export async function updateContact(contact: Partial<ContactData>): Promise<ContactData> {
  const data = await readAppData();
  data.contact = { ...data.contact, ...contact };
  await writeAppData(data);
  return data.contact;
}

export async function getPortfolio(category?: string): Promise<PortfolioItem[]> {
  const data = await readAppData();
  const sorted = [...data.portfolio].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (category && category !== 'All') {
    return sorted.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  return sorted;
}

export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | undefined> {
  const data = await readAppData();
  return data.portfolio.find(p => p.slug === slug || p.id === slug);
}

export async function savePortfolioItem(item: PortfolioItem): Promise<PortfolioItem> {
  const data = await readAppData();
  const index = data.portfolio.findIndex(p => p.id === item.id);
  item.updatedAt = new Date().toISOString();
  if (index >= 0) {
    data.portfolio[index] = item;
  } else {
    item.createdAt = item.createdAt || new Date().toISOString();
    data.portfolio.push(item);
  }
  await writeAppData(data);
  return item;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const data = await readAppData();
  const index = data.portfolio.findIndex(p => p.id === id);
  if (index === -1) return false;

  const item = data.portfolio[index];

  // Physically delete associated media files
  for (const media of item.media) {
    if (media.path && media.path.startsWith('/uploads/')) {
      const fullPath = path.join(process.cwd(), 'public', media.path);
      try {
        await fs.unlink(fullPath);
      } catch (e) {
        // file might have already been removed
      }
    }
  }

  data.portfolio.splice(index, 1);
  await writeAppData(data);
  return true;
}

export async function getLeads(): Promise<LeadData[]> {
  const data = await readAppData();
  return [...data.leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addLead(lead: LeadData): Promise<LeadData> {
  const data = await readAppData();
  data.leads.unshift(lead);
  await writeAppData(data);
  return lead;
}

export async function updateLead(id: string, updates: Partial<LeadData>): Promise<LeadData | null> {
  const data = await readAppData();
  const index = data.leads.findIndex(l => l.id === id);
  if (index === -1) return null;
  data.leads[index] = { ...data.leads[index], ...updates };
  await writeAppData(data);
  return data.leads[index];
}

export async function deleteLead(id: string): Promise<boolean> {
  const data = await readAppData();
  const index = data.leads.findIndex(l => l.id === id);
  if (index === -1) return false;
  data.leads.splice(index, 1);
  await writeAppData(data);
  return true;
}

export async function getAssistantConfig(): Promise<AssistantData> {
  const data = await readAppData();
  return data.assistant;
}

export async function updateAssistantConfig(updates: Partial<AssistantData>): Promise<AssistantData> {
  const data = await readAppData();
  data.assistant = { ...data.assistant, ...updates };
  await writeAppData(data);
  return data.assistant;
}

export async function getSettings(): Promise<SettingsData> {
  const data = await readAppData();
  return data.settings;
}

export async function updateSettings(updates: Partial<SettingsData>): Promise<SettingsData> {
  const data = await readAppData();
  data.settings = { ...data.settings, ...updates };
  await writeAppData(data);
  return data.settings;
}
