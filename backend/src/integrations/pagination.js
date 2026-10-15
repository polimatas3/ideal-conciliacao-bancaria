export async function fetchAllPages(fetchPage) {
  const items = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages) {
    const result = await fetchPage(page)
    items.push(...result.items)
    totalPages = result.totalPages
    page += 1
  }
  return items
}
