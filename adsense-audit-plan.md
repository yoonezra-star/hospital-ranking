# hospital-ranking.kr AdSense / Trust Audit Plan

Last updated: 2026-07-01

## Current Baseline

- Repository: `https://github.com/yoonezra-star/hospital-ranking.git`
- Production branch: `main`
- Production domain: `https://hospital-ranking.kr`
- Deploy path: local change -> `git commit` -> `git push origin main` -> Cloudflare Pages auto deploy
- Current site name: 병원찾기
- AdSense publisher id: `ca-pub-1441018945572157`

## Completed Approval-Oriented Work

- Replaced the former “병원랭킹” naming direction with “병원찾기” in major user-facing areas.
- Added AdSense approval script without showing empty ad boxes.
- Added `ads.txt`, `robots.txt`, `sitemap.xml`, `404.html`, `_headers`, and clean canonical URL handling.
- Confirmed clean URLs such as `/guide`, `/detail?id=101`, and `/about`.
- Rebuilt health guide pages with readable Korean content, medical safety notes, correction contact, and JSON-LD.
- Added short-cache headers for guide pages to reduce stale Cloudflare HTML.
- Confirmed sample landing/detail/home pages have Korean content, safety notices, and no empty ad slots.

## Current Risk Assessment

### High Priority

- Keep checking for mojibake or broken Korean text after bulk page generation.
- Improve unique value on regional and operating-condition landing pages so they do not look like thin duplicates.
- Strengthen hospital detail pages with more stable public-data fields when API responses allow it.

### Medium Priority

- Add a visible data freshness note near dynamic hospital lists.
- Add more internal links from search results and detail pages to relevant guides.
- Verify Search Console sitemap submission after every major URL structure change.

### Low Priority

- Improve README and operation docs whenever scripts or deployment behavior change.
- Add optional local smoke-test script for title, canonical, JSON-LD, and broken-text checks.

## Next Execution Plan

1. Run a recurring broken-text audit across HTML and JS before every push.
2. Expand the most important landing pages first:
   - `seoul-dental.html`
   - `night-clinic.html`
   - `saturday-clinic.html`
   - `new-openings.html`
   - `manual-therapy-clinic.html`
3. Improve detail-page data transparency:
   - show which fields are from public data
   - show which fields are estimated or guide-style summaries
   - keep medical disclaimer visible
4. Re-run sitemap generation and submit `https://hospital-ranking.kr/sitemap.xml` in Google Search Console.
5. After live deployment, verify:
   - homepage
   - one guide page
   - one landing page
   - one detail page

## Operational Rule

All production changes should be committed and pushed to GitHub `main`. Cloudflare Pages should be treated as the deploy target, not as a place to edit files manually.
