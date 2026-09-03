import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canUseDashboardViewPreference,
  COMPACT_MOBILE_COARSE_MAX_WIDTH,
  COMPACT_MOBILE_NARROW_MAX_WIDTH,
  isCompactMobileViewport,
  resolveDashboardView
} from '../src/frontend/utils/compactMobile.js'

test('compact mobile includes narrow screens and coarse-pointer landscape phones', () => {
  assert.equal(isCompactMobileViewport({ width: COMPACT_MOBILE_NARROW_MAX_WIDTH, coarsePointer: false }), true)
  assert.equal(isCompactMobileViewport({ width: COMPACT_MOBILE_NARROW_MAX_WIDTH + 1, coarsePointer: false }), false)
  assert.equal(isCompactMobileViewport({ width: COMPACT_MOBILE_COARSE_MAX_WIDTH, coarsePointer: true }), true)
  assert.equal(isCompactMobileViewport({ width: COMPACT_MOBILE_COARSE_MAX_WIDTH + 1, coarsePointer: true }), false)
  assert.equal(isCompactMobileViewport({ width: 0, coarsePointer: true }), false)
})

test('compact mode fixes only the effective view to bar', () => {
  assert.equal(resolveDashboardView({ compactMobile: true, width: 390, desktopView: 'map' }), 'bar')
  assert.equal(resolveDashboardView({ compactMobile: true, width: 844, coarsePointer: true, desktopView: 'ring' }), 'bar')
  assert.equal(resolveDashboardView({ compactMobile: true, width: 1200, coarsePointer: true, desktopView: 'table' }), 'table')
  assert.equal(resolveDashboardView({ compactMobile: false, width: 390, desktopView: 'map' }), 'map')
})

test('desktop view preferences are inaccessible while compact mode is active', () => {
  assert.equal(canUseDashboardViewPreference({ compactMobile: true, width: 390 }), false)
  assert.equal(canUseDashboardViewPreference({ compactMobile: true, width: 844, coarsePointer: true }), false)
  assert.equal(canUseDashboardViewPreference({ compactMobile: true, width: 1200, coarsePointer: true }), true)
  assert.equal(canUseDashboardViewPreference({ compactMobile: false, width: 390 }), true)
})
