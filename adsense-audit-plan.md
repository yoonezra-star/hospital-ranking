# hospital-ranking.kr AdSense / Trust Audit Plan

Last updated: 2026-06-18

## 1. Current status

- GitHub remote confirmed:
  - `origin https://github.com/yoonezra-star/hospital-ranking.git`
- Cloudflare Pages deploy path is working.
- Public site domain is connected:
  - `hospital-ranking.kr`
  - `www.hospital-ranking.kr`
- Naver Maps client id currently wired in code:
  - `rgd9ajy97r`

## 2. What is already improved

- Fake AdSense tags were replaced with neutral `Ad slot` placeholders.
- Public API keys were removed from frontend code.
- Cloudflare secrets are being used for protected API calls.
- Homepage hospital list was stabilized with curated fallback data when live APIs fail.
- Homepage map now degrades to a clean fallback card instead of showing a broken auth UI.
- Detail page now renders stable hospital info, review summary cards, and a Naver Map outbound link box.
- Contact, privacy, and terms pages exist, which is important for AdSense trust review.

## 3. Current blocker

### Naver Map is not fully authorized on the live domain

Code-side client id wiring is done, but the live domain is still behaving like a Naver Cloud authorization failure.

Observed behavior:

- Homepage map falls back with an auth/domain warning.
- Detail page uses a stable fallback link box instead of a live embedded map.

What likely remains in Naver Cloud:

1. Check the web service app tied to `rgd9ajy97r`.
2. Add all live/testing hostnames allowed for the Maps JavaScript app.
3. Re-test after propagation.

Recommended hostnames to register:

- `hospital-ranking.kr`
- `www.hospital-ranking.kr`
- `hospital-ranking.pages.dev`

Official reference:

- Naver Cloud Maps troubleshooting: [https://guide.ncloud-docs.com/docs/en/maps-troubleshoot](https://guide.ncloud-docs.com/docs/en/maps-troubleshoot)

Note:

- The official troubleshooting page confirms the script should use `ncpClientId`.
- Based on the live auth-fail behavior, the remaining issue is very likely domain/app registration rather than a code typo.

## 4. AdSense approval risk areas

### A. Content quality

Priority: High

- Many hospital pages still rely on fallback/mock-style content.
- Guide pages must feel editorial, useful, and distinct, not template-generated.
- Thin pages with very similar layout and shallow text reduce approval chances.

Actions:

1. Expand each guide page with:
   - clear author/editorial voice
   - medically safe disclaimers
   - original summaries
   - practical sections such as symptoms, when to visit, cost, prep, caution
2. Make each major department landing block link to at least 2-3 relevant guide pages.
3. Add last-updated text on guides and key info pages.

### B. Trust / policy signals

Priority: High

- Site needs stronger organization identity.
- Contact page exists, but business/site-operator trust can be clearer.

Actions:

1. Strengthen `about.html` with:
   - who operates the site
   - what data sources are used
   - what the site does not guarantee
2. Add a footer trust block sitewide:
   - contact email
   - privacy
   - terms
   - about
3. Add a short medical-information disclaimer on detail and guide pages.

### C. Data transparency

Priority: High

- Public API instability is currently masked by fallback data.
- This is acceptable only if disclosure is clear.

Actions:

1. Keep the visible data-source badge.
2. Add one short explanation:
   - live public data may be delayed
   - fallback summaries may be shown temporarily
3. Add a “data source / methodology” section on `about.html`.

### D. Indexing and crawl hygiene

Priority: Medium

Actions:

1. Verify `robots.txt`.
2. Rebuild `sitemap.xml` so all live guide/detail routes that should index are included.
3. Submit domain property in Google Search Console.
4. Check canonical consistency:
   - `hospital-ranking.kr`
   - `www.hospital-ranking.kr`
5. Avoid duplicate URLs between `/detail?id=...` and any alternate route variant if one exists.

### E. UX / technical quality

Priority: Medium

Actions:

1. Remove remaining broken-looking placeholders from public-facing areas.
2. Ensure all pages have:
   - valid title
   - unique description
   - visible H1
3. Check image `alt` text where relevant.
4. Run Lighthouse on:
   - homepage
   - 1 guide page
   - 1 detail page

## 5. Recommended execution order

### Phase 1: Approval-safe cleanup

1. Finish Naver Cloud domain registration for map authorization.
2. Strengthen `about.html`.
3. Add sitewide trust/disclaimer footer language.
4. Review guide pages for thin or repetitive copy.

### Phase 2: Search and content depth

1. Improve internal linking between homepage, guides, and detail pages.
2. Expand top guide pages into stronger editorial content.
3. Add methodology/data-source explanation.

### Phase 3: Search engine operations

1. Search Console verification
2. Sitemap refresh
3. Index coverage review
4. Monitor manual actions / policy warnings

## 6. Immediate next coding tasks I recommend

1. Rewrite `about.html` into a stronger trust page.
2. Add a reusable trust/disclaimer/footer block across all pages.
3. Audit all guide pages for duplicated or low-value sections.
4. Review detail-page metadata and structured data consistency.
