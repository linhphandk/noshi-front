import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Button, TextField, Text, Flex, Card, Badge, IconButton } from "@radix-ui/themes"
import { useForm } from "react-hook-form"
import { useCreateProfile, useAddManualPlatform, useGetProfile } from "@/api/generated"

interface Platform {
  platform: "instagram" | "tiktok" | "youtube"
  handle: string
  followerCount: number
}

interface OnboardingData {
  name: string
  bio: string
  location: string
  platforms: Platform[]
  niches: string[]
}

const NICHES = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Tech",
  "Gaming",
  "Lifestyle",
  "Education",
  "Finance",
  "Health",
  "Entertainment",
  "Parenting",
  "Pets",
  "DIY",
]

const STEPS = ["About you", "Platforms", "Niches", "Done"]

const ALL_PLATFORMS: Platform["platform"][] = ["instagram", "tiktok", "youtube"]

const OnboardingPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingData>({
    name: "",
    bio: "",
    location: "",
    platforms: [],
    niches: [],
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: data.name, bio: data.bio, location: data.location },
  })

  const handleAboutSubmit = (formData: { name: string; bio: string; location: string }) => {
    setData((prev) => ({ ...prev, ...formData }))
    setStep(1)
  }

  const usedPlatforms = data.platforms.map((p) => p.platform)
  const hasUnusedPlatform = ALL_PLATFORMS.some((p) => !usedPlatforms.includes(p))

  const addPlatform = () => {
    const next = ALL_PLATFORMS.find((p) => !usedPlatforms.includes(p))
    if (!next) return
    setData((prev) => ({
      ...prev,
      platforms: [
        ...prev.platforms,
        { platform: next, handle: "", followerCount: 0 },
      ],
    }))
  }

  const updatePlatform = (index: number, field: keyof Platform, value: string | number) => {
    setData((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p, i) =>
        i === index ? { ...p, [field]: value } : p,
      ),
    }))
  }

  const removePlatform = (index: number) => {
    setData((prev) => ({
      ...prev,
      platforms: prev.platforms.filter((_, i) => i !== index),
    }))
  }

  const toggleNiche = (niche: string) => {
    setData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }))
  }

  const createProfileMutation = useCreateProfile()
  const addPlatformMutation = useAddManualPlatform()
  const { data: existingProfile } = useGetProfile()

  useEffect(() => {
    if (existingProfile) {
      navigate("/dashboard")
    }
  }, [existingProfile, navigate])

  const handleSubmitAll = async () => {
    setServerError(null)
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      await createProfileMutation.mutateAsync({
        data: { slug, headline: data.bio, niches: data.niches },
      })

      for (const p of data.platforms) {
        if (p.handle) {
          await addPlatformMutation.mutateAsync({
            data: { platform: p.platform, handle: p.handle, follower_count: p.followerCount },
          })
        }
      }

      navigate("/dashboard")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Something went wrong"
      setServerError(msg)
    }
  }

  return (
    <Flex align="center" justify="center" className="min-h-screen bg-[var(--gray-2)] px-4">
      <Card size="4" className="w-full max-w-lg">
        <Flex direction="column" gap="5">
          {/* Progress */}
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Step {step + 1} of {STEPS.length}
            </Text>
            <Text size="2" weight="medium">
              {STEPS[step]}
            </Text>
          </Flex>

          {/* Step 0: About you */}
          {step === 0 && (
            <form onSubmit={handleSubmit(handleAboutSubmit)}>
              <Flex direction="column" gap="4">
                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Name
                  </Text>
                  <TextField.Root
                    placeholder="Jane Doe"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <Text size="1" color="red">{errors.name.message}</Text>
                  )}
                </Flex>

                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Bio
                  </Text>
                  <TextField.Root
                    placeholder="A short description about yourself"
                    {...register("bio", { required: "Bio is required" })}
                  />
                  {errors.bio && (
                    <Text size="1" color="red">{errors.bio.message}</Text>
                  )}
                </Flex>

                <Flex direction="column" gap="1">
                  <Text as="label" size="2" weight="medium">
                    Location
                  </Text>
                  <TextField.Root
                    placeholder="Los Angeles, CA"
                    {...register("location")}
                  />
                </Flex>

                <Button type="submit" size="3">
                  Continue
                </Button>
              </Flex>
            </form>
          )}

          {/* Step 1: Platforms */}
          {step === 1 && (
            <Flex direction="column" gap="4">
              <Text size="2" color="gray">
                Add your social platforms. You can skip and add later.
              </Text>

              {data.platforms.map((plat, i) => (
                <Card key={i} variant="surface">
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Text size="2" weight="medium">
                        Platform {i + 1}
                      </Text>
                      <IconButton
                        size="1"
                        variant="ghost"
                        color="red"
                        onClick={() => removePlatform(i)}
                      >
                        ✕
                      </IconButton>
                    </Flex>
                    <Flex gap="3">
                      <Flex direction="column" gap="1" className="flex-1">
                        <Text as="label" size="1" color="gray">
                          Platform
                        </Text>
                        <select
                          value={plat.platform}
                          onChange={(e) =>
                            updatePlatform(i, "platform", e.target.value)
                          }
                          className="rounded-[var(--radius-2)] border border-[var(--gray-6)] bg-[var(--gray-1)] px-3 py-2 text-sm text-[var(--gray-12)]"
                        >
                          {ALL_PLATFORMS.map((p) => (
                            <option
                              key={p}
                              value={p}
                              disabled={p !== plat.platform && usedPlatforms.includes(p)}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>
                      </Flex>
                      <Flex direction="column" gap="1" className="flex-1">
                        <Text as="label" size="1" color="gray">
                          Handle
                        </Text>
                        <TextField.Root
                          placeholder="@username"
                          value={plat.handle}
                          onChange={(e) =>
                            updatePlatform(i, "handle", e.target.value)
                          }
                        />
                      </Flex>
                      <Flex direction="column" gap="1" className="flex-1">
                        <Text as="label" size="1" color="gray">
                          Followers
                        </Text>
                        <TextField.Root
                          type="number"
                          placeholder="0"
                          value={plat.followerCount || ""}
                          onChange={(e) =>
                            updatePlatform(
                              i,
                              "followerCount",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              ))}

              {hasUnusedPlatform && (
                <Button variant="soft" onClick={addPlatform}>
                  + Add platform
                </Button>
              )}

              <Flex gap="3">
                <Button variant="soft" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button onClick={() => setStep(2)}>Continue</Button>
              </Flex>
            </Flex>
          )}

          {/* Step 2: Niches */}
          {step === 2 && (
            <Flex direction="column" gap="4">
              <Text size="2" color="gray">
                Select the niches you create content in.
              </Text>

              <Flex wrap="wrap" gap="2">
                {NICHES.map((niche) => (
                  <Badge
                    key={niche}
                    size="2"
                    variant={data.niches.includes(niche) ? "solid" : "outline"}
                    color={data.niches.includes(niche) ? "iris" : "gray"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleNiche(niche)}
                  >
                    {niche}
                  </Badge>
                ))}
              </Flex>

              <Text size="1" color="gray">
                {data.niches.length} selected
              </Text>

              <Flex gap="3">
                <Button variant="soft" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>Continue</Button>
              </Flex>
            </Flex>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <Flex direction="column" gap="4" align="center">
              <Text size="5" weight="bold">
                You're all set!
              </Text>
              <Text size="2" color="gray" align="center">
                Your profile is ready. You can always edit these details later
                from your dashboard.
              </Text>

              {serverError && (
                <Text size="2" color="red" role="alert">
                  {serverError}
                </Text>
              )}

              <Flex gap="3">
                <Button variant="soft" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmitAll}>Go to dashboard</Button>
              </Flex>
            </Flex>
          )}
        </Flex>
      </Card>
    </Flex>
  )
}

export default OnboardingPage
