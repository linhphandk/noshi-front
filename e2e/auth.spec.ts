import { test, expect } from "@playwright/test"

function testEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

const PASSWORD = "password123"

test.describe("Auth — page rendering", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
    await expect(page.getByPlaceholder("jane@example.com")).toBeVisible()
    await expect(page.getByPlaceholder("Your password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible()
  })

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
    await expect(page.getByPlaceholder("Jane Doe")).toBeVisible()
    await expect(page.getByPlaceholder("jane@example.com")).toBeVisible()
    await expect(page.getByPlaceholder("At least 8 characters")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible()
  })

  test("login page links to signup", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: "Sign up" }).click()
    await expect(page).toHaveURL(/signup/)
  })

  test("signup page links to login", async ({ page }) => {
    await page.goto("/signup")
    await page.getByRole("link", { name: "Log in" }).click()
    await expect(page).toHaveURL(/login/)
  })
})

test.describe("Auth — signup", () => {
  test("signup → onboarding", async ({ page }) => {
    const email = testEmail()
    await page.goto("/signup")
    await page.getByPlaceholder("Jane Doe").fill("Jane Doe")
    await page.getByPlaceholder("jane@example.com").fill(email)
    await page.getByPlaceholder("At least 8 characters").fill(PASSWORD)
    await page.getByRole("button", { name: "Sign up" }).click()
    await expect(page).toHaveURL(/onboarding/)
  })

  test("signup shows error on duplicate email", async ({ page }) => {
    const email = testEmail()
    await page.request.post("http://localhost:3000/auth/register", {
      data: { email, name: "Dup User", password: PASSWORD },
    })

    await page.goto("/signup")
    await page.getByPlaceholder("Jane Doe").fill("Dup User")
    await page.getByPlaceholder("jane@example.com").fill(email)
    await page.getByPlaceholder("At least 8 characters").fill(PASSWORD)
    await page.getByRole("button", { name: "Sign up" }).click()

    await expect(page.getByText("Email already registered")).toBeVisible()
  })

  test("signup shows validation error for short password", async ({ page }) => {
    await page.goto("/signup")
    await page.getByPlaceholder("Jane Doe").fill("Jane")
    await page.getByPlaceholder("jane@example.com").fill(testEmail())
    await page.getByPlaceholder("At least 8 characters").fill("short")
    await page.getByRole("button", { name: "Sign up" }).click()

    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible()
  })

  test("signup shows validation error for empty name", async ({ page }) => {
    await page.goto("/signup")
    await page.getByPlaceholder("jane@example.com").fill(testEmail())
    await page.getByPlaceholder("At least 8 characters").fill(PASSWORD)
    await page.getByRole("button", { name: "Sign up" }).click()

    await expect(page.getByText("Name is required")).toBeVisible()
  })
})

test.describe("Auth — login", () => {
  test("login → dashboard", async ({ page }) => {
    const email = testEmail()
    await page.request.post("http://localhost:3000/auth/register", {
      data: { email, name: "Login User", password: PASSWORD },
    })

    await page.goto("/login")
    await page.getByPlaceholder("jane@example.com").fill(email)
    await page.getByPlaceholder("Your password").fill(PASSWORD)
    await page.getByRole("button", { name: "Log in" }).click()
    await expect(page).toHaveURL(/dashboard/)
  })

  test("login shows error on bad credentials", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("jane@example.com").fill("nonexistent@example.com")
    await page.getByPlaceholder("Your password").fill("wrongpassword")
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page.getByText("Invalid email or password")).toBeVisible()
  })

  test("login shows validation error for empty email", async ({ page }) => {
    await page.goto("/login")
    await page.getByPlaceholder("Your password").fill(PASSWORD)
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page.getByText("Email is required")).toBeVisible()
  })
})

test.describe("Auth — navigation guards", () => {
  test("unauthenticated user redirected from /onboarding", async ({ page }) => {
    await page.goto("/onboarding")
    await expect(page).toHaveURL(/login/)
  })

  test("unauthenticated user redirected from /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/login/)
  })

  test("unauthenticated user redirected from /profile/edit", async ({ page }) => {
    await page.goto("/profile/edit", { waitUntil: "networkidle" })
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })
})
