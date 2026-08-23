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
  overrides: { slug?: string; headline?: string; niches?: string[] } = {},
) {
  const res = await page.request.post("http://localhost:3000/profile", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      slug: overrides.slug ?? uniqueSlug("test"),
      headline: overrides.headline ?? "Test headline",
      niches: overrides.niches ?? ["Travel"],
    },
  })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

test.describe("Profile edit — no profile", () => {
  test("shows no profile found", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await expect(page.getByText("No profile found")).toBeVisible()
  })

  test("create profile button navigates to onboarding", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "Create Profile" }).click()
    await expect(page).toHaveURL(/onboarding/)
  })
})

test.describe("Profile edit — with profile", () => {
  test("loads existing profile data", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, {
      slug: uniqueSlug("load"),
      headline: "My headline",
      niches: ["Travel", "Food"],
    })

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.waitForSelector("input")
    const inputs = page.locator("input")
    await expect(inputs.nth(1)).toHaveValue("My headline")
  })

  test("updates headline and saves", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const slug = uniqueSlug("hl")
    await createProfile(page, access_token, {
      slug,
      headline: "Old headline",
    })

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.waitForSelector("input")
    const headlineInput = page.locator("input").nth(1)
    await headlineInput.clear()
    await headlineInput.fill("New headline")
    await page.getByRole("button", { name: "Save changes" }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    const res = await page.request.get("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = await res.json()
    expect(profile.headline).toBe("New headline")
  })

  test("updates slug", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("old") })

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.waitForSelector("input")
    const slugInput = page.locator("input").nth(0)
    const newSlug = uniqueSlug("new")
    await slugInput.clear()
    await slugInput.fill(newSlug)
    await page.getByRole("button", { name: "Save changes" }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    const res = await page.request.get("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = await res.json()
    expect(profile.slug).toBe(newSlug)
  })

  test("toggles niches", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, {
      slug: uniqueSlug("niche"),
      niches: ["Travel"],
    })

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.waitForSelector("text=Travel")

    await page.getByText("Fashion", { exact: true }).click()
    await page.getByText("Travel", { exact: true }).click()

    await page.getByRole("button", { name: "Save changes" }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    const res = await page.request.get("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = await res.json()
    expect(profile.niches).toContain("Fashion")
    expect(profile.niches).not.toContain("Travel")
  })

  test("back button returns to dashboard", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("back") })

    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await page.waitForSelector("text=Edit Profile")
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page).toHaveURL(/dashboard/)
  })
})
