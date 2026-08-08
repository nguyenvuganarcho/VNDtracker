export interface Category {
  categoryId: number;
  userId: number | null;
  nameKey: string | null;
  name: string | null;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}
