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

test.describe("Dashboard — no profile", () => {
  test("shows create profile prompt when no profile exists", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/dashboard")
    await expect(page.getByText("Welcome to Noshi")).toBeVisible()
    await expect(page.getByText("Set up your profile to get started")).toBeVisible()
    await expect(page.getByRole("button", { name: "Create Profile" })).toBeVisible()
  })

  test("create profile button navigates to onboarding", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Create Profile" }).click()
    await expect(page).toHaveURL(/onboarding/)
  })
})

test.describe("Dashboard — with profile", () => {
  test("displays profile data", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, {
      slug: uniqueSlug("dash"),
      headline: "My headline",
      niches: ["Fashion", "Beauty"],
    })

    await page.goto("/dashboard")
    await expect(page.getByText("My headline")).toBeVisible()
    await expect(page.getByText("Fashion")).toBeVisible()
    await expect(page.getByText("Beauty")).toBeVisible()
  })

  test("displays platforms", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const slug = uniqueSlug("plat")
    await createProfile(page, access_token, { slug })
    await addPlatform(page, access_token, "instagram", "@instauser", 5000)

    await page.goto("/dashboard")
    await expect(page.getByText("Platforms")).toBeVisible()
    await expect(page.getByText("instagram")).toBeVisible()
    await expect(page.getByText("@instauser")).toBeVisible()
    await expect(page.getByText("5,000 followers")).toBeVisible()
  })

  test("shows user email in header", async ({ page }) => {
    const email = testEmail()
    const { access_token, user } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("email") })

    await page.goto("/dashboard")
    await expect(page.getByText(user.email)).toBeVisible()
  })

  test("shows completion score", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("score") })

    await page.goto("/dashboard")
    await expect(page.getByText("Completion")).toBeVisible()
  })

  test("edit profile button navigates to /profile/edit", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("edit") })

    await page.goto("/dashboard")
    await page.getByRole("button", { name: "Edit Profile" }).click()
    await expect(page).toHaveURL(/profile\/edit/)
  })
})

test.describe("Dashboard — logout", () => {
  test("logout clears session and redirects to login", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    await createProfile(page, access_token, { slug: uniqueSlug("logout") })

    await page.goto("/dashboard")
    await expect(page.getByText("Log out")).toBeVisible()
    await page.getByRole("button", { name: "Log out" }).click()
    await expect(page).toHaveURL(/login/, { timeout: 10000 })

    // Verify token was cleared (addInitScript doesn't re-run in same page session)
    const token = await page.evaluate(() => localStorage.getItem("noshi_access_token"))
    expect(token).toBeNull()
  })
})
