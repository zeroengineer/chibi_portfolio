import { expect, test, type Page } from '@playwright/test';
import { PHASES } from '../../src/lib/phases';

const LAST_FRAME = PHASES.professional.frames[1];

const frame = (page: Page) => page.locator('canvas[data-frame]');
const currentFrame = async (page: Page) => Number(await frame(page).getAttribute('data-frame'));

/** Waits until scrolling has come to rest and the walker has stopped. */
async function settle(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const before = scrollY;
          await new Promise((r) => setTimeout(r, 200));
          const moving = document.querySelector('[data-moving]')?.getAttribute('data-moving');
          return scrollY === before && moving === 'false';
        }),
      { timeout: 8000 },
    )
    .toBe(true);
}

async function scrollToFraction(page: Page, fraction: number) {
  await page.evaluate((f) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
  await settle(page);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-journey', 'ready');
});

test('starts on the first frame and ends on the last one', async ({ page }) => {
  await expect(frame(page)).toHaveAttribute('data-frame', '0');

  await scrollToFraction(page, 1);
  await expect(frame(page)).toHaveAttribute('data-frame', String(LAST_FRAME));
  await expect(page.locator('#contact h2')).toBeInViewport();

  await scrollToFraction(page, 0);
  await expect(frame(page)).toHaveAttribute('data-frame', '0');
});

test('ages while walking forward and rewinds while walking back', async ({ page }) => {
  const forward: number[] = [];
  for (let i = 0; i <= 10; i++) {
    await scrollToFraction(page, i / 10);
    forward.push(await currentFrame(page));
  }
  const backward: number[] = [];
  for (let i = 10; i >= 0; i--) {
    await scrollToFraction(page, i / 10);
    backward.push(await currentFrame(page));
  }

  expect(forward).toEqual([...forward].sort((a, b) => a - b));
  expect(backward).toEqual([...forward].reverse());
  expect(new Set(forward).size).toBeGreaterThan(6);
});

test('navigating to a chapter shows the matching age', async ({ page, isMobile }) => {
  const open = async () => {
    if (isMobile || (page.viewportSize()?.width ?? 0) < 1280)
      await page.getByRole('button', { name: /chapters/i }).click();
  };
  const nav = page.getByRole('navigation', { name: 'Chapters' }).last();

  await open();
  await nav.getByRole('link', { name: 'Education' }).click();
  await expect(page.locator('#education [data-reveal]').first()).toBeInViewport();
  await expect.poll(() => currentFrame(page)).toBeLessThanOrEqual(PHASES.student.frames[1]);
  await expect(page).toHaveURL(/#education$/);

  await open();
  await nav.getByRole('link', { name: 'Experience' }).click();
  await expect(page.locator('#experience [data-reveal]').first()).toBeInViewport();
  await expect.poll(() => currentFrame(page)).toBeGreaterThanOrEqual(PHASES.professional.frames[0]);
});

test('deep links land on their chapter', async ({ page }) => {
  await page.goto('/#highlights');
  await settle(page);
  await expect(page.locator('#highlights h2')).toBeInViewport();
  const f = await currentFrame(page);
  expect(f).toBeGreaterThanOrEqual(PHASES.leader.frames[0]);
  expect(f).toBeLessThanOrEqual(PHASES.leader.frames[1]);
});

test('content fits between the header and the ground at every point of the walk', async ({ page }) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  for (let i = 0; i <= 24; i++) {
    await scrollToFraction(page, i / 24);
    const clipped = await page.evaluate(() => {
      const header = document.querySelector('header')!.getBoundingClientRect().bottom;
      const ground =
        innerHeight - parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ground-h'));
      return [...document.querySelectorAll('[data-reveal]')]
        .map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.left >= 0 && r.right <= innerWidth)
        .filter(({ r }) => r.top < header || r.bottom > ground)
        .map(({ el }) => el.textContent?.trim().slice(0, 40));
    });
    expect(clipped, `at ${i}/24`).toEqual([]);
  }
});

test('keeps working with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('#about [data-reveal]').first()).toHaveCSS('opacity', '1');
  await scrollToFraction(page, 1);
  await expect(frame(page)).toHaveAttribute('data-frame', String(LAST_FRAME));
});
