import { test, expect } from "@playwright/test"

test.describe("Auth flow", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
    await expect(page.getByPlaceholder("jane@example.com")).toBeVisible()
  })

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible()
    await expect(page.getByPlaceholder("Jane Doe")).toBeVisible()
  })

  test("login → onboarding", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          expires_in: 900,
          user: { id: "u1", email: "jane@test.com", name: "Jane" },
        }),
      }),
    )

    await page.goto("/login")
    await page.getByPlaceholder("jane@example.com").fill("jane@test.com")
    await page.getByPlaceholder("Your password").fill("password123")
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page).toHaveURL(/onboarding/)
  })

  test("signup → onboarding", async ({ page }) => {
    await page.route("**/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          expires_in: 900,
          user: { id: "u1", email: "jane@test.com", name: "Jane" },
        }),
      }),
    )

    await page.goto("/signup")
    await page.getByPlaceholder("Jane Doe").fill("Jane Doe")
    await page.getByPlaceholder("jane@example.com").fill("jane@test.com")
    await page.getByPlaceholder("At least 8 characters").fill("password123")
    await page.getByRole("button", { name: "Sign up" }).click()

    await expect(page).toHaveURL(/onboarding/)
  })

  test("login shows error on bad credentials", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid email or password" }),
      }),
    )

    await page.goto("/login")
    await page.getByPlaceholder("jane@example.com").fill("jane@test.com")
    await page.getByPlaceholder("Your password").fill("wrong")
    await page.getByRole("button", { name: "Log in" }).click()

    await expect(page.getByText("Invalid email or password")).toBeVisible()
  })

  test("unauthenticated user redirected from protected route", async ({ page }) => {
    await page.goto("/onboarding")
    await expect(page).toHaveURL(/login/)
  })
})

test.describe("Onboarding flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("noshi_access_token", "mock-token")
      localStorage.setItem("noshi_user", JSON.stringify({ id: "u1", email: "jane@test.com", name: "Jane" }))
    })
  })

  test("completes onboarding and redirects to dashboard", async ({ page }) => {
    await page.route("**/profile", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ id: "p1", user_id: "u1", slug: "jane-doe" }),
        })
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "p1", user_id: "u1", slug: "jane-doe" }),
      })
    })

    await page.goto("/onboarding")

    // Step 1: About
    await page.getByPlaceholder("Jane Doe").fill("Jane Doe")
    await page.getByPlaceholder(/Fitness creator/).fill("Travel & lifestyle creator")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 2: Platforms (skip)
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 3: Niches
    await page.getByText("Travel").click()
    await page.getByText("Lifestyle").click()
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 4: Submit
    await page.getByRole("button", { name: "Go to dashboard" }).click()

    await expect(page).toHaveURL(/dashboard/)
  })
})
