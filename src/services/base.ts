import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type TableName = keyof Database['public']['Tables'];

export function createBaseService<T extends { id: string }>(tableName: TableName) {
  return {
    async getAll(): Promise<T[]> {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return (data as unknown as T[]) || [];
    },

    async getById(id: string, studioId?: string): Promise<T | null> {
      let query = supabase.from(tableName).select('*').eq('id', id);
      if (studioId) {
        query = query.eq('studio_id', studioId);
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return data as unknown as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export async function fetchAll<T>(tableName: TableName): Promise<T[]> {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) throw error;
  return (data as unknown as T[]) || [];
}

export async function fetchById<T>(tableName: TableName, id: string, studioId?: string): Promise<T | null> {
  let query = supabase.from(tableName).select('*').eq('id', id);
  if (studioId) {
    query = query.eq('studio_id', studioId);
  }
  const { data, error } = await query.single();
  if (error) throw error;
  return data as unknown as T;
}

export async function createOne<T>(tableName: TableName, item: Partial<T>): Promise<T> {
  const { data, error } = await (supabase.from(tableName) as unknown as {
    insert: (row: Partial<T>) => { select: () => { single: () => Promise<{ data: T | null; error: Error | null }> } };
  }).insert(item).select().single();
  if (error) throw error;
  return data as T;
}

export async function updateOne<T>(tableName: TableName, id: string, updates: Partial<T>): Promise<T> {
  const { data, error } = await (supabase.from(tableName) as unknown as {
    update: (row: Partial<T>) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: T | null; error: Error | null }> } } };
  }).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as T;
}

export async function deleteOne(tableName: TableName, id: string): Promise<void> {
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw error;
}
