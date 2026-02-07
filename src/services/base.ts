import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type TableName = keyof Database['public']['Tables'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function createBaseService<T extends { id: string }>(tableName: TableName) {
  return {
    async getAll(): Promise<T[]> {
      const { data, error } = await db.from(tableName).select('*');
      if (error) throw error;
      return (data as T[]) || [];
    },

    async getById(id: string, studioId?: string): Promise<T | null> {
      let query = db.from(tableName).select('*').eq('id', id);
      if (studioId) {
        query = query.eq('studio_id', studioId);
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return data as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await db.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export async function fetchAll<T>(tableName: string): Promise<T[]> {
  const { data, error } = await db.from(tableName).select('*');
  if (error) throw error;
  return (data as T[]) || [];
}

export async function fetchById<T>(tableName: string, id: string, studioId?: string): Promise<T | null> {
  let query = db.from(tableName).select('*').eq('id', id);
  if (studioId) {
    query = query.eq('studio_id', studioId);
  }
  const { data, error } = await query.single();
  if (error) throw error;
  return data as T;
}

export async function createOne<T>(tableName: string, item: Partial<T>): Promise<T> {
  const { data, error } = await db.from(tableName).insert(item).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateOne<T>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
  const { data, error } = await db.from(tableName).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as T;
}

export async function deleteOne(tableName: string, id: string): Promise<void> {
  const { error } = await db.from(tableName).delete().eq('id', id);
  if (error) throw error;
}
