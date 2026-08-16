import { useState } from "react"
import { Link } from "react-router"
import { Button, TextField, Text, Flex, Separator } from "@radix-ui/themes"
import { useForm } from "react-hook-form"

import AuthLayout from "@/pages/auth/AuthLayout"
import type { ForgotPasswordRequest, ApiError } from "@/types/auth"

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>()

  const onSubmit = async (data: ForgotPasswordRequest) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body: ApiError = await res.json()
        setServerError(body.message || "Something went wrong")
        return
      }

      setSubmitted(true)
    } catch {
      setServerError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="If an account exists with that email, we've sent a password reset link."
      >
        <Button asChild size="3">
          <Link to="/login">Back to login</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
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

          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </Flex>
      </form>

      <Separator size="4" />

      <Text as="p" size="2" align="center" color="gray">
        Remember your password?{" "}
        <Link to="/login" className="text-[var(--iris-11)] hover:underline">
          Log in
        </Link>
      </Text>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
