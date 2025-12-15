import { PostgrestResponse } from '@supabase/supabase-js';
import { PaginatedResponse } from '@/types';

/**
 * Convert Supabase query response to PaginatedResponse format
 */
export const toPaginatedResponse = <T>(
  data: T[],
  count: number | null,
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<T> => {
  const totalPages = count ? Math.ceil(count / pageSize) : 1;
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  return {
    count: count || data.length,
    next: hasNext ? `?page=${page + 1}&page_size=${pageSize}` : null,
    previous: hasPrevious ? `?page=${page - 1}&page_size=${pageSize}` : null,
    results: data,
  };
};

/**
 * Calculate range for Supabase pagination
 */
export const getPaginationRange = (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

/**
 * Execute paginated query with Supabase
 */
export const executePaginatedQuery = async <T>(
  query: any,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<T>> => {
  const { from, to } = getPaginationRange(page, pageSize);

  const [dataResponse, countResponse] = await Promise.all([
    query.range(from, to),
    query.select('*', { count: 'exact', head: true }),
  ]);

  if (dataResponse.error) {
    throw new Error(dataResponse.error.message);
  }

  return toPaginatedResponse<T>(
    (dataResponse.data as T[]) || [],
    countResponse.count,
    page,
    pageSize
  );
};

