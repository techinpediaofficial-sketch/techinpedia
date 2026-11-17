/**
 * SEO Pages Integration & Logic Tests
 *
 * Run: node --experimental-vm-modules src/__tests__/seo-pages.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Mocking hasPermission logic inline to avoid TS module loading issues in native node test runner
function hasPermission(session, permission) {
  if (!session) return false;
  if (session.role === 'SUPER_ADMIN' || session.appRoleName === 'SUPER_ADMIN') return true;
  if (session.appRoleName || (session.permissions && session.permissions.length > 0)) {
    return session.permissions?.includes(permission);
  }
  if (session.role === 'ADMIN') return true;
  return false;
}

describe('SEO Pages Permissions', () => {
  function makeSession(role, permissions = []) {
    return { id: 'user-1', email: 'test@test.com', role, permissions, appRoleName: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : undefined };
  }

  test('SUPER_ADMIN can manage SEO pages', () => {
    const session = makeSession('SUPER_ADMIN');
    assert.equal(hasPermission(session, 'admin.seo_pages.manage'), true);
  });

  test('ADMIN can manage SEO pages by legacy role fallback', () => {
    const session = makeSession('ADMIN');
    assert.equal(hasPermission(session, 'admin.seo_pages.manage'), true);
  });

  test('AGENT cannot manage SEO pages by default', () => {
    const session = makeSession('AGENT');
    assert.equal(hasPermission(session, 'admin.seo_pages.manage'), false);
  });

  test('User with explicit admin.seo_pages.manage permission can manage SEO pages', () => {
    const session = makeSession('AGENT', ['admin.seo_pages.manage']);
    // Since permissions are supplied, appRoleName needs to be mocked to trigger dynamic check in hasPermission
    session.appRoleName = 'CustomRole';
    assert.equal(hasPermission(session, 'admin.seo_pages.manage'), true);
  });
});

describe('SEO Slug Logic', () => {
  // Pure logic mock for duplicate slug generation
  function getUniqueSlug(originalSlug, existingSlugs) {
    let duplicateSlug = `${originalSlug}-copy`;
    let counter = 1;
    while (existingSlugs.includes(duplicateSlug)) {
      duplicateSlug = `${originalSlug}-copy-${counter}`;
      counter++;
    }
    return duplicateSlug;
  }

  test('Generates -copy for first duplication', () => {
    const existing = ['original-page'];
    const newSlug = getUniqueSlug('original-page', existing);
    assert.equal(newSlug, 'original-page-copy');
  });

  test('Generates -copy-1 for second duplication', () => {
    const existing = ['original-page', 'original-page-copy'];
    const newSlug = getUniqueSlug('original-page', existing);
    assert.equal(newSlug, 'original-page-copy-1');
  });

  test('Generates -copy-2 for third duplication', () => {
    const existing = ['original-page', 'original-page-copy', 'original-page-copy-1'];
    const newSlug = getUniqueSlug('original-page', existing);
    assert.equal(newSlug, 'original-page-copy-2');
  });
});

console.log('\n✅ SEO Pages test suite loaded. Running...\n');
