import { test, expect } from "@playwright/test"

function testEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
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

test.describe("Onboarding — minimal (skip platforms)", () => {
  test("completes onboarding with niches only", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const creatorName = uniqueName("TestCreator")

    await page.goto("/onboarding")

    // Step 0: About you
    await page.getByPlaceholder("Jane Doe").fill(creatorName)
    await page.getByPlaceholder("A short description about yourself").fill("Travel creator")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 1: Platforms — skip
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 2: Niches
    await page.getByText("Travel").click()
    await page.getByText("Lifestyle").click()
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 3: Done
    await page.getByRole("button", { name: "Go to dashboard" }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    // Verify via API
    const profileRes = await page.request.get("http://localhost:3000/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const profile = await profileRes.json()
    expect(profile.slug).toBeTruthy()
    expect(profile.headline).toBe("Travel creator")
    expect(profile.niches).toContain("Travel")
    expect(profile.niches).toContain("Lifestyle")
  })
})

test.describe("Onboarding — with platforms", () => {
  test("adds a platform during onboarding", async ({ page }) => {
    const email = testEmail()
    const { access_token } = await registerAndLogin(page, email)
    const creatorName = uniqueName("PlatformUser")

    await page.goto("/onboarding")

    // Step 0: About you
    await page.getByPlaceholder("Jane Doe").fill(creatorName)
    await page.getByPlaceholder("A short description about yourself").fill("Content creator")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 1: Platforms — click "Add platform" then fill
    await page.getByRole("button", { name: "+ Add platform" }).click()
    await page.getByPlaceholder("@username").fill("@testuser")
    await page.getByPlaceholder("0").fill("5000")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 2: Niches
    await page.getByText("Fashion").click()
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 3: Done
    await page.getByRole("button", { name: "Go to dashboard" }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    // Verify platform via API
    const platRes = await page.request.get("http://localhost:3000/profile/platforms", {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const platforms = await platRes.json()
    expect(platforms).toHaveLength(1)
    expect(platforms[0].platform).toBe("instagram")
    expect(platforms[0].handle).toBe("@testuser")
    expect(platforms[0].follower_count).toBe(5000)
  })

  test("can skip platforms step", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/onboarding")
    await page.getByPlaceholder("Jane Doe").fill(uniqueName("SkipUser"))
    await page.getByPlaceholder("A short description about yourself").fill("Creator")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 1: click Continue without adding platforms
    await page.getByRole("button", { name: "Continue" }).click()

    // Should be on niches step
    await expect(page.getByText("Step 3 of 4")).toBeVisible()
  })
})

test.describe("Onboarding — step navigation", () => {
  test("can go back between steps", async ({ page }) => {
    const email = testEmail()
    await registerAndLogin(page, email)

    await page.goto("/onboarding")

    // Step 0
    await page.getByPlaceholder("Jane Doe").fill(uniqueName("BackUser"))
    await page.getByPlaceholder("A short description about yourself").fill("Creator")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 1 → go back
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page.getByText("Step 1 of 4")).toBeVisible()
  })
})
