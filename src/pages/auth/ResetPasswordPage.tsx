import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { Button, TextField, Text, Flex } from "@radix-ui/themes"
import { useForm } from "react-hook-form"

import AuthLayout from "@/pages/auth/AuthLayout"
import type { ResetPasswordRequest, ApiError } from "@/types/auth"

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordRequest & { confirm: string }>({
    defaultValues: { token: token || "" },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- need watch for password confirmation
  const password = watch("password")

  const onSubmit = async (data: ResetPasswordRequest) => {
    setServerError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
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

  if (!token) {
    return (
      <AuthLayout title="Invalid link">
        <Text size="2" color="gray">
          This password reset link is invalid or missing a token.
        </Text>
        <Button asChild size="3">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthLayout>
    )
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Password reset"
        subtitle="Your password has been updated."
      >
        <Button asChild size="3">
          <Link to="/login">Log in</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password.">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap="4">
          {serverError && (
            <Text size="2" color="red" role="alert">
              {serverError}
            </Text>
          )}

          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              New password
            </Text>
            <TextField.Root
              type="password"
              placeholder="At least 8 characters"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
            />
            {errors.password && (
              <Text size="1" color="red">
                {errors.password.message}
              </Text>
            )}
          </Flex>

          <Flex direction="column" gap="1">
            <Text as="label" size="2" weight="medium">
              Confirm password
            </Text>
            <TextField.Root
              type="password"
              placeholder="Re-enter password"
              {...register("confirm", {
                required: "Please confirm your password",
                validate: (v) => v === password || "Passwords do not match",
              })}
            />
            {errors.confirm && (
              <Text size="1" color="red">
                {errors.confirm.message}
              </Text>
            )}
          </Flex>

          <Button type="submit" size="3" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset password"}
          </Button>
        </Flex>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
