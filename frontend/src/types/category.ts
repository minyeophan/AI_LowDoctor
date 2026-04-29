// src/types/category.ts

export type CategoryType = 'real_estate';

export interface CategoryInfo {
  label: string;
  color: string;
}

export type CategoryMap = Record<CategoryType, CategoryInfo>;