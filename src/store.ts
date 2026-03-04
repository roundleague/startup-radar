import { create } from 'zustand'
import type { DateRangeFilter } from './lib/types'

export interface DataSourceMeta {
  source: 'newsapi' | 'mock' | 'database'
  message: string
  fetchedAt: string
}

interface StoreState {
  // Filters
  search: string
  fundingStage: string
  industry: string
  location: string
  dateRange: DateRangeFilter
  minScore: number

  // UI state
  selectedId: string | null
  isRefreshing: boolean
  dataSource: DataSourceMeta | null

  // Actions
  setSearch: (v: string) => void
  setFundingStage: (v: string) => void
  setIndustry: (v: string) => void
  setLocation: (v: string) => void
  setDateRange: (v: DateRangeFilter) => void
  setMinScore: (v: number) => void
  setSelectedId: (id: string | null) => void
  setIsRefreshing: (v: boolean) => void
  setDataSource: (meta: DataSourceMeta) => void
  resetFilters: () => void
}

const defaultFilters = {
  search: '',
  fundingStage: '',
  industry: '',
  location: '',
  dateRange: 'all' as DateRangeFilter,
  minScore: 0,
}

export const useStore = create<StoreState>((set) => ({
  ...defaultFilters,
  selectedId: null,
  isRefreshing: false,
  dataSource: null,

  setSearch: (search) => set({ search }),
  setFundingStage: (fundingStage) => set({ fundingStage }),
  setIndustry: (industry) => set({ industry }),
  setLocation: (location) => set({ location }),
  setDateRange: (dateRange) => set({ dateRange }),
  setMinScore: (minScore) => set({ minScore }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setIsRefreshing: (isRefreshing) => set({ isRefreshing }),
  setDataSource: (dataSource) => set({ dataSource }),
  resetFilters: () => set(defaultFilters),
}))
