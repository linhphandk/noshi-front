import { useState } from "react"
import { Link } from "react-router"
import { Button, TextField, Text, Flex, Separator } from "@radix-ui/themes"
import { useForm } from "react-hook-form"

import AuthLayout from "@/pages/auth/AuthLayout"
import type { LoginRequest, ApiError } from "@/types/auth"

const LoginPage = () => {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const body: ApiError | Awaited<ReturnType<typeof res.json>> =
        await res.json()

      if (!res.ok) {
        setServerError(
          "message" in body ? body.message : "Something went wrong",
        )
        return
      }

      // TODO: store tokens + redirect (PR7)
    } catch {
      setServerError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Noshi account."
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="4">
          {serverError && (
            <Text size="2" color="red" role="alert">
              {serverError}
            </Text>
          )}

          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Email
            </Text>
            <TextField.Root
              type="email"
              placeholder="jane@example.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              })}
            />
            {errors.email && (
              <Text size="1" color="red">
                {errors.email.message}
              </Text>
            )}
          </Flex>

          <Flex direction="column" gap="1">
            <Flex justify="between" align="center">
              <Text as="label" size="2" weight="medium">
                Password
              </Text>
              <Link
                to="/forgot-password"
                className="text-[var(--iris-11)] text-[var(--font-size-2)] hover:underline"
              >
                Forgot password?
              </Link>
            </Flex>
            <TextField.Root
              type="password"
              placeholder="Your password"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <Text size="1" color="red">
                {errors.password.message}
              </Text>
            )}
          </Flex>

          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
        </Flex>
      </form>

      <Separator size="4" />

      <Text as="p" size="2" align="center" color="gray">
        Don't have an account?{" "}
        <Link to="/signup" className="text-[var(--iris-11)] hover:underline">
          Sign up
        </Link>
      </Text>
    </AuthLayout>
  )
}

export default LoginPage
