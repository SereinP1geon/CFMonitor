export const COMPACT_MOBILE_NARROW_MAX_WIDTH = 768
export const COMPACT_MOBILE_COARSE_MAX_WIDTH = 980

export const isCompactMobileViewport = ({ width, coarsePointer = false } = {}) => {
  const viewportWidth = Number(width)
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return false

  return viewportWidth <= COMPACT_MOBILE_NARROW_MAX_WIDTH ||
    (coarsePointer === true && viewportWidth <= COMPACT_MOBILE_COARSE_MAX_WIDTH)
}

export const resolveDashboardView = ({ compactMobile = false, width, coarsePointer = false, desktopView = 'bar' } = {}) => {
  if (compactMobile && isCompactMobileViewport({ width, coarsePointer })) return 'bar'
  return desktopView
}

export const canUseDashboardViewPreference = ({ compactMobile = false, width, coarsePointer = false } = {}) => {
  return !(compactMobile && isCompactMobileViewport({ width, coarsePointer }))
}
