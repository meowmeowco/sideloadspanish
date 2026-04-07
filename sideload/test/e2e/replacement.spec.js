/**
 * E2E tests for basic word replacement.
 * Verifies: content script injects, words get replaced, excluded elements are skipped.
 */
import { test, expect } from './extension.fixture.js';

const BASE_URL = 'http://localhost:8384';

test.describe('Basic word replacement', () => {
  test('replaces known words with Spanish translations', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForSelector('.sideload-word', { timeout: 10_000 });

    // At least some words should be replaced
    const spans = extensionPage.locator('.sideload-word');
    const count = await spans.count();
    expect(count).toBeGreaterThan(0);
  });

  test('replaced words have correct data attributes', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForSelector('.sideload-word', { timeout: 10_000 });

    const firstSpan = extensionPage.locator('.sideload-word').first();
    // Every replaced word should have original, tier, and es data
    await expect(firstSpan).toHaveAttribute('data-original');
    await expect(firstSpan).toHaveAttribute('data-tier');
    await expect(firstSpan).toHaveAttribute('data-es');
  });

  test('does not replace text inside <code> elements', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    // Wait for replacer to finish
    await extensionPage.waitForTimeout(2000);

    const codeBlock = extensionPage.locator('#code-block code');
    const sideloadSpans = codeBlock.locator('.sideload-word');
    expect(await sideloadSpans.count()).toBe(0);
  });

  test('does not replace text inside <pre> elements', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForTimeout(2000);

    const preBlock = extensionPage.locator('#pre-block');
    const sideloadSpans = preBlock.locator('.sideload-word');
    expect(await sideloadSpans.count()).toBe(0);
  });

  test('does not replace text inside <input> elements', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForTimeout(2000);

    const input = extensionPage.locator('#input-adjacent input');
    const value = await input.inputValue();
    // Input value should remain untouched
    expect(value).toBe('the house');
  });

  test('tooltip appears on hover and shows original word', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForSelector('.sideload-word', { timeout: 10_000 });

    const span = extensionPage.locator('.sideload-word').first();
    await span.hover();

    const tooltip = extensionPage.locator('.sideload-tooltip--visible');
    await expect(tooltip).toBeVisible({ timeout: 3000 });

    // Tooltip should show the original English word
    const original = await span.getAttribute('data-original');
    await expect(tooltip).toContainText(original);
  });

  test('clicking a word marks it as known', async ({ extensionPage }) => {
    await extensionPage.goto(`${BASE_URL}/page-with-nouns.html`);
    await extensionPage.waitForSelector('.sideload-word', { timeout: 10_000 });

    const span = extensionPage.locator('.sideload-word').first();

    // Should not be known initially
    await expect(span).not.toHaveClass(/sideload-word--known/);

    // Click
    await span.click();

    // Should become known
    await expect(span).toHaveClass(/sideload-word--known/, { timeout: 2000 });
  });
});
