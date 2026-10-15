import { describe, expect, it, vi } from 'vitest'
import { fetchAllPages } from './pagination.js'

describe('fetchAllPages', () => {
  it('walks every page and concatenates items', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1, 2], totalPages: 3 })
      .mockResolvedValueOnce({ items: [3], totalPages: 3 })
      .mockResolvedValueOnce({ items: [4, 5], totalPages: 3 })
    expect(await fetchAllPages(fetchPage)).toEqual([1, 2, 3, 4, 5])
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 3])
  })

  it('handles a single empty page', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ items: [], totalPages: 0 })
    expect(await fetchAllPages(fetchPage)).toEqual([])
    expect(fetchPage).toHaveBeenCalledTimes(1)
  })
})
