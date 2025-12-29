# Quick Reference: URL Filters for Your Documentation Sites

This is a quick reference for setting up URL filters for the specific documentation sites you mentioned.

## Sites to Scan

### 1. Mantine v7

- **Base URL**: `https://v7.mantine.dev/getting-started/`
- **Include Pattern**: `^https://v7\.mantine\.dev/`
- **Exclude Pattern**: None needed

**Why**: The `^` anchors to the start, ensuring only v7.mantine.dev URLs are matched. The `.` is escaped as `\.` to match a literal dot.

---

### 2. PowerSync

- **Base URL**: `https://docs.powersync.com/intro/powersync-overview`
- **Include Pattern**: `^https://docs\.powersync\.com/`
- **Exclude Pattern**: None needed

**Why**: Single version docs, no filtering needed beyond the domain.

---

### 3. Kysely

- **Base URL**: `https://kysely.dev/docs/getting-started`
- **Include Pattern**: `^https://kysely\.dev/docs/`
- **Exclude Pattern**: None needed

**Why**: Limits to the /docs/ section only.

---

### 4. React Router 6.30.2

- **Base URL**: `https://reactrouter.com/6.30.2`
- **Include Pattern**: `^https://reactrouter\.com/6\.30\.2/`
- **Exclude Pattern**: `^https://reactrouter\.com/home`

**Why**: Include ensures only version 6.30.2 is scanned. Exclude prevents the home page from being included.

---

### 5. Zod v3

- **Base URL**: `https://v3.zod.dev/`
- **Include Pattern**: `^https://v3\.zod\.dev/`
- **Exclude Pattern**: None needed

**Why**: The v3 subdomain makes this straightforward.

---

### 6. Zustand

- **Base URL**: `https://zustand.docs.pmnd.rs/getting-started/introduction`
- **Include Pattern**: `^https://zustand\.docs\.pmnd\.rs/`
- **Exclude Pattern**: None needed

**Why**: Single version on unique subdomain.

---

### 7. React Hook Form

- **Base URL**: `https://react-hook-form.com/docs`
- **Include Pattern**: `^https://react-hook-form\.com/docs/`
- **Exclude Pattern**: None needed

**Why**: Limits to /docs/ section.

---

### 8. AI SDK (not v5)

- **Base URL**: `https://ai-sdk.dev/docs/introduction`
- **Include Pattern**: `^https://ai-sdk\.dev/docs/`
- **Exclude Pattern**: `^https://v5\.ai-sdk\.dev/`

**Why**: Include gets current version, exclude prevents v5 from being included if linked.

---

### 9. Next.js App Router (not v15)

- **Base URL**: `https://nextjs.org/docs/app/getting-started`
- **Include Pattern**: `^https://nextjs\.org/docs/app/`
- **Exclude Pattern**: `/docs/15/`

**Why**: Include limits to App Router docs. Exclude prevents version 15 specific pages.

---

## Sites to Avoid (These will be automatically excluded with the patterns above)

❌ `https://v5.ai-sdk.dev/docs/introduction` - Excluded by pattern
❌ `https://nextjs.org/docs/15/app/getting-started` - Excluded by pattern
❌ `https://mantine.dev/getting-started/` - Won't match include pattern
❌ `https://reactrouter.com/home` - Excluded by pattern

---

## Copy-Paste Ready Patterns

For quick setup, here are the patterns ready to copy:

| Site               | Include Pattern                       | Exclude Pattern                  |
| ------------------ | ------------------------------------- | -------------------------------- |
| Mantine v7         | `^https://v7\.mantine\.dev/`          |                                  |
| PowerSync          | `^https://docs\.powersync\.com/`      |                                  |
| Kysely             | `^https://kysely\.dev/docs/`          |                                  |
| React Router       | `^https://reactrouter\.com/6\.30\.2/` | `^https://reactrouter\.com/home` |
| Zod v3             | `^https://v3\.zod\.dev/`              |                                  |
| Zustand            | `^https://zustand\.docs\.pmnd\.rs/`   |                                  |
| React Hook Form    | `^https://react-hook-form\.com/docs/` |                                  |
| AI SDK             | `^https://ai-sdk\.dev/docs/`          | `^https://v5\.ai-sdk\.dev/`      |
| Next.js App Router | `^https://nextjs\.org/docs/app/`      | `/docs/15/`                      |

---

## Setup Instructions

1. Go to `/sites/new` in your app
2. For each documentation site:
   - Enter the **Base URL**
   - Add a **Name** (e.g., "Mantine v7")
   - Add a **Description**
   - Click **"Add Pattern"** under "Include Patterns"
   - Paste the include pattern from the table above
   - If there's an exclude pattern, click **"Add Pattern"** under "Exclude Patterns" and paste it
   - Click **"Add & Start Discovery"**

3. The system will automatically:
   - Create the site
   - Apply the URL filters
   - Start discovering pages
   - Only find pages that match your filters

4. After discovery completes:
   - Review the discovered URLs
   - Click "Index" to start the full indexing process
   - Once indexed, you can chat with the docs!

---

## Verification

After discovery, verify the URLs match your expectations:

✅ **Good**: All URLs should be from the correct version/section
✅ **Good**: No unwanted version URLs should appear
❌ **Bad**: If you see wrong versions, update filters and re-discover

You can click "URL Filters" button at any time to modify patterns and then click "Re-discover" to try again.
