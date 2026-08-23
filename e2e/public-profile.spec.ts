import { test, expect } from "@playwright/test"

function testEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

const PASSWORD = "password123"

async function registerAndLogin(page: import("@playwright/test").Page, email: string) {
  const res = await page.request.post("http://localhost:3000/auth/register", {
    data: { email, name: "Test User", password: PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  const { access_token, expires_in, user } = await res.json()

  await page.addInitScript(({ token, expiry, userData }) => {
    localStorage.setItem("noshi_access_token", token)
    localStorage.setItem("noshi_token_expiry", String(Date.now() + expiry * 1000))
    localStorage.setItem("noshi_user", JSON.stringify(userData))
  }, { token: access_token, expiry: expires_in, userData: user })

  return { access_token, user }
}

async function createProfile(
  page: import("@playwright/test").Page,
  token: string,
  overrides: { slug?: string; headline?: string; niches?: string[]; is_published?: boolean } = {},
) {
  const res = await page.request.post("http://localhost:3000/profile", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      slug: overrides.slug ?? uniqueSlug("test"),
      headline: overrides.headline ?? "Test headline",
      niches: overrides.niches ?? ["Travel"],
      ...(overrides.is_published !== undefined && { is_published: overrides.is_published }),
    },
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

async function addPlatform(
  page: import("@playwright/test").Page,
  token: string,
  platform = "instagram",
  handle = "@testhandle",
  follower_count = 1000,
) {
  const res = await page.request.post("http://localhost:3000/profile/platforms", {
    headers: { Authorization: `Bearer ${token}` },
    data: { platform, handle, follower_count },
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

test.describe("Public profile — view", () => {
  test("displays profile by slug", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const slug = uniqueSlug("pub")
    await createProfile(page, access_token, {
      slug,
      headline: "Public headline",
      niches: ["Fashion", "Beauty"],
      is_published: true,
    })
    await addPlatform(page, access_token, "instagram", "@publicinsta", 10000)

    await page.goto(`/${slug}`)
    await expect(page.getByText("Public headline")).toBeVisible()
    await expect(page.getByText("Fashion")).toBeVisible()
    await expect(page.getByText("Beauty")).toBeVisible()
    await expect(page.getByText("instagram")).toBeVisible()
    await expect(page.getByText("@publicinsta")).toBeVisible()
    await expect(page.getByText("10,000", { exact: true })).toBeVisible()
  })

  test("shows profile not found for nonexistent slug", async ({ page }) => {
    await page.goto("/nonexistent-user-xyz")
    await expect(page.getByText("Profile not found")).toBeVisible()
  })

  test("shows total followers", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const slug = uniqueSlug("followers")
    await createProfile(page, access_token, {
      slug,
      is_published: true,
    })
    await addPlatform(page, access_token, "instagram", "@insta", 5000)
    await addPlatform(page, access_token, "tiktok", "@tiktok", 3000)

    await page.goto(`/${slug}`)
    await expect(page.getByText("8,000 total followers")).toBeVisible()
  })
})

test.describe("Public profile — no auth required", () => {
  test("accessible without login", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const slug = uniqueSlug("noauth")
    await createProfile(page, access_token, {
      slug,
      headline: "Public",
      is_published: true,
    })

    // Fresh page without auth
    await page.goto(`/${slug}`)
    await expect(page.getByText("Public")).toBeVisible()
  })
})
