const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'iPhone SE', width: 320, height: 568 },
  { name: 'iPhone 6/7/8', width: 375, height: 667 },
  { name: 'iPhone 12/13/14', width: 390, height: 844 },
  { name: 'iPhone XR/11', width: 414, height: 896 },
  { name: 'iPad vertical', width: 768, height: 1024 },
  { name: 'iPad horizontal', width: 1024, height: 768 },
  { name: 'iPad Air vertical', width: 810, height: 1080 },
  { name: 'iPad Pro 11 vertical', width: 820, height: 1180 },
  { name: 'Desktop HD', width: 1280, height: 720 },
  { name: 'Desktop FHD', width: 1920, height: 1080 },
  { name: 'Desktop QHD', width: 2560, height: 1440 },
];

// Threshold below which the mobile hamburger menu is shown
const MOBILE_BREAKPOINT = 768;

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'networkidle' });
    });

    test('no horizontal page overflow', async ({ page }) => {
      const result = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          clientWidth: docEl.clientWidth,
        };
      });
      expect(
        result.scrollWidth,
        `Page overflows horizontally (scrollWidth=${result.scrollWidth}px > clientWidth=${result.clientWidth}px)`
      ).toBeLessThanOrEqual(result.clientWidth);
    });

    test('no text elements overflow their containers', async ({ page }) => {
      const overflows = await page.evaluate(() => {
        const results = [];
        // Select all elements that could contain text
        const elements = document.querySelectorAll(
          'h1, h2, h3, h4, p, span, a, li, div, button, label'
        );
        for (const el of elements) {
          // Skip elements inside the internal scroll section
          if (el.closest('.events-scroll')) continue;
          // Skip structural wrappers, logo (intentional overflow), and icon elements
          if (el.classList.contains('site') || el.classList.contains('logo') || el.closest('.logo')) continue;
          if (el.classList.contains('contact-item__icon')) continue;
          if (el.classList.contains('nav__inner') || el.classList.contains('nav')) continue;
          // Skip hidden elements
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
          // Skip elements with intentional overflow behavior
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
          if (style.overflowX === 'hidden' && style.textOverflow === 'ellipsis') continue;

          const scrollW = el.scrollWidth;
          const clientW = el.clientWidth;
          if (scrollW > clientW + 1) { // 1px tolerance
            // Get a useful selector for the element
            let selector = el.tagName.toLowerCase();
            if (el.id) selector += `#${el.id}`;
            if (el.className && typeof el.className === 'string') {
              selector += '.' + el.className.trim().split(/\s+/).join('.');
            }
            const text = (el.textContent || '').trim().slice(0, 50);
            results.push({
              selector,
              text,
              scrollWidth: scrollW,
              clientWidth: clientW,
              overflow: scrollW - clientW,
            });
          }
        }
        return results;
      });
      if (overflows.length > 0) {
        const details = overflows
          .map(o => `  "${o.text}" (${o.selector}): overflows by ${o.overflow}px (scrollWidth=${o.scrollWidth}, clientWidth=${o.clientWidth})`)
          .join('\n');
        expect(overflows.length, `Text overflow detected:\n${details}`).toBe(0);
      }
    });

    test('no visible elements extend beyond viewport right edge', async ({ page }) => {
      // First check if page can actually scroll horizontally - if not,
      // elements with rect.right > viewport are clipped by the browser and not visible
      const canScroll = await page.evaluate(() => {
        window.scrollTo(10000, 0);
        const scrolled = window.scrollX > 0;
        window.scrollTo(0, 0);
        return scrolled;
      });
      if (!canScroll) return; // No horizontal scroll = no visible overflow

      const issues = await page.evaluate((vw) => {
        const results = [];
        const elements = document.querySelectorAll(
          'h1, h2, h3, h4, p, a, span, button, .nav__link, .hero-link, .contact-item, .org-link, .event-card'
        );
        for (const el of elements) {
          if (el.closest('.events-scroll')) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;

          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          // Check the element's visible right edge considering parent clipping
          let visibleRight = rect.right;
          let parent = el.parentElement;
          while (parent) {
            const ps = window.getComputedStyle(parent);
            if (['hidden', 'clip', 'scroll', 'auto'].includes(ps.overflow) ||
                ['hidden', 'clip', 'scroll', 'auto'].includes(ps.overflowX)) {
              const pr = parent.getBoundingClientRect();
              visibleRight = Math.min(visibleRight, pr.right);
            }
            parent = parent.parentElement;
          }

          if (visibleRight > vw + 1) { // 1px tolerance
            let selector = el.tagName.toLowerCase();
            if (el.id) selector += `#${el.id}`;
            if (el.className && typeof el.className === 'string') {
              selector += '.' + el.className.trim().split(/\s+/).join('.');
            }
            const text = (el.textContent || '').trim().slice(0, 50);
            results.push({
              selector,
              text,
              right: Math.round(rect.right),
              viewportWidth: vw,
              overflowBy: Math.round(rect.right - vw),
            });
          }
        }
        return results;
      }, viewport.width);

      if (issues.length > 0) {
        const details = issues
          .map(i => `  "${i.text}" (${i.selector}): right edge at ${i.right}px, viewport=${i.viewportWidth}px, overflows by ${i.overflowBy}px`)
          .join('\n');
        expect(issues.length, `Elements extend beyond viewport:\n${details}`).toBe(0);
      }
    });

    if (viewport.width > MOBILE_BREAKPOINT) {
      test('nav links fully within viewport', async ({ page }) => {
        const navIssues = await page.evaluate((vw) => {
          const results = [];
          const links = document.querySelectorAll('.nav__link');
          for (const link of links) {
            // Skip if inside mobile overlay menu (hidden)
            if (link.closest('.nav__menu')) {
              const menuStyle = window.getComputedStyle(link.closest('.nav__menu'));
              if (menuStyle.visibility === 'hidden' || menuStyle.opacity === '0') continue;
            }
            const rect = link.getBoundingClientRect();
            if (rect.width === 0) continue;

            const issues = [];
            if (rect.left < 0) issues.push(`left edge at ${Math.round(rect.left)}px`);
            if (rect.right > vw) issues.push(`right edge at ${Math.round(rect.right)}px (viewport: ${vw}px)`);

            if (issues.length > 0) {
              results.push({
                text: link.textContent.trim(),
                problems: issues,
                rect: {
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                },
              });
            }
          }
          return results;
        }, viewport.width);

        if (navIssues.length > 0) {
          const details = navIssues
            .map(n => `  "${n.text}": ${n.problems.join(', ')} (rect: left=${n.rect.left}, right=${n.rect.right}, width=${n.rect.width})`)
            .join('\n');
          expect(navIssues.length, `Nav links outside viewport:\n${details}`).toBe(0);
        }
      });
    }

    test('hero title fits within viewport', async ({ page }) => {
      // Skip if page doesn't actually scroll horizontally
      const canScroll = await page.evaluate(() => {
        window.scrollTo(10000, 0);
        const scrolled = window.scrollX > 0;
        window.scrollTo(0, 0);
        return scrolled;
      });
      if (!canScroll) return;

      const heroIssue = await page.evaluate((vw) => {
        const title = document.querySelector('.hero__title');
        if (!title) return null;
        const rect = title.getBoundingClientRect();
        const fontSize = parseFloat(window.getComputedStyle(title).fontSize);

        // Check if visually clipped by a parent
        let visibleRight = rect.right;
        let parent = title.parentElement;
        while (parent) {
          const ps = window.getComputedStyle(parent);
          if (ps.overflow === 'hidden' || ps.overflowX === 'hidden') {
            const pr = parent.getBoundingClientRect();
            visibleRight = Math.min(visibleRight, pr.right);
          }
          parent = parent.parentElement;
        }

        return {
          right: Math.round(rect.right),
          visibleRight: Math.round(visibleRight),
          viewportWidth: vw,
          fontSize: Math.round(fontSize),
          text: title.textContent.trim(),
          overflows: visibleRight > vw + 1,
        };
      }, viewport.width);

      if (heroIssue) {
        expect(
          heroIssue.overflows,
          `Hero title "${heroIssue.text}" overflows at ${viewport.width}px viewport (fontSize=${heroIssue.fontSize}px, visibleRight=${heroIssue.visibleRight}px, right=${heroIssue.right}px)`
        ).toBe(false);
      }
    });

    test('hero title font size is proportional to viewport', async ({ page }) => {
      const info = await page.evaluate(() => {
        const title = document.querySelector('.hero__title');
        if (!title) return null;
        return {
          fontSize: parseFloat(window.getComputedStyle(title).fontSize),
        };
      });

      if (info) {
        const maxReasonableFontSize = viewport.width * 0.15;
        expect(
          info.fontSize,
          `Hero title font-size (${info.fontSize}px) is too large for ${viewport.width}px viewport. ` +
          `Max reasonable: ${Math.round(maxReasonableFontSize)}px. ` +
          `Consider using clamp() or a responsive font-size.`
        ).toBeLessThanOrEqual(maxReasonableFontSize);
      }
    });

    test('section titles font size is proportional to viewport', async ({ page }) => {
      const issues = await page.evaluate((vw) => {
        const results = [];
        const titles = document.querySelectorAll('.section__title');
        const maxSize = vw * 0.08;
        for (const title of titles) {
          const fontSize = parseFloat(window.getComputedStyle(title).fontSize);
          if (fontSize > maxSize) {
            results.push({
              text: title.textContent.trim().slice(0, 40),
              fontSize: Math.round(fontSize),
              maxReasonable: Math.round(maxSize),
            });
          }
        }
        return results;
      }, viewport.width);

      if (issues.length > 0) {
        const details = issues
          .map(i => `  "${i.text}": ${i.fontSize}px (max reasonable: ${i.maxReasonable}px)`)
          .join('\n');
        expect(issues.length, `Section titles too large for viewport:\n${details}`).toBe(0);
      }
    });

    test('no text-text overlap between sibling elements', async ({ page }) => {
      const overlaps = await page.evaluate(() => {
        const results = [];

        function getVisibleTextElements(root) {
          const els = [];
          const candidates = root.querySelectorAll(
            'h1, h2, h3, h4, p, span, a, li, button, .event-card__title, .event-card__subtitle, .event-card__meta, .contact-item__label, .contact-item__value'
          );
          for (const el of candidates) {
            if (el.closest('.events-scroll')) continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (!el.textContent.trim()) continue;
            els.push({ el, rect });
          }
          return els;
        }

        function isAncestor(a, b) {
          return a.contains(b) || b.contains(a);
        }

        const elements = getVisibleTextElements(document);

        for (let i = 0; i < elements.length; i++) {
          for (let j = i + 1; j < elements.length; j++) {
            const a = elements[i];
            const b = elements[j];

            // Skip parent-child relationships
            if (isAncestor(a.el, b.el)) continue;

            // Check for meaningful overlap (more than 2px in both dimensions)
            const overlapX = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
            const overlapY = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);

            if (overlapX > 2 && overlapY > 2) {
              let selectorA = a.el.tagName.toLowerCase();
              if (a.el.className && typeof a.el.className === 'string') selectorA += '.' + a.el.className.trim().split(/\s+/)[0];
              let selectorB = b.el.tagName.toLowerCase();
              if (b.el.className && typeof b.el.className === 'string') selectorB += '.' + b.el.className.trim().split(/\s+/)[0];

              results.push({
                elementA: `"${a.el.textContent.trim().slice(0, 30)}" (${selectorA})`,
                elementB: `"${b.el.textContent.trim().slice(0, 30)}" (${selectorB})`,
                overlapX: Math.round(overlapX),
                overlapY: Math.round(overlapY),
              });
            }
          }
        }
        return results;
      });

      if (overlaps.length > 0) {
        // Deduplicate and show top 5
        const details = overlaps
          .slice(0, 5)
          .map(o => `  ${o.elementA} overlaps with ${o.elementB} by ${o.overlapX}x${o.overlapY}px`)
          .join('\n');
        const suffix = overlaps.length > 5 ? `\n  ... and ${overlaps.length - 5} more` : '';
        expect(overlaps.length, `Text overlap detected:\n${details}${suffix}`).toBe(0);
      }
    });
  });
}
