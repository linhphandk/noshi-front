import { useState } from "react"
import { useNavigate } from "react-router"
import {
  Button,
  TextField,
  Text,
  Flex,
  Card,
  Badge,
  Spinner,
  Switch,
} from "@radix-ui/themes"
import { useGetProfile, useUpdateProfile } from "@/api/generated"

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

const ProfileEditPage = () => {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useGetProfile()
  const updateProfile = useUpdateProfile()

  const [slug, setSlug] = useState("")
  const [headline, setHeadline] = useState("")
  const [niches, setNiches] = useState<string[]>([])
  const [isPublished, setIsPublished] = useState(false)
  const [initialized, setInitialized] = useState(false)

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Spinner size="3" />
      </Flex>
    )
  }

  if (!profile) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        className="min-h-screen"
      >
        <Text size="5" weight="bold">
          No profile found
        </Text>
        <Button onClick={() => navigate("/onboarding")}>Create Profile</Button>
      </Flex>
    )
  }

  if (!initialized) {
    setSlug(profile.slug)
    setHeadline(profile.headline)
    setNiches(profile.niches.filter(Boolean) as string[])
    setIsPublished(profile.is_published)
    setInitialized(true)
  }

  const toggleNiche = (niche: string) => {
    setNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche],
    )
  }

  const handleSave = async () => {
    await updateProfile.mutateAsync({
      data: { slug, headline, niches, is_published: isPublished },
    })
    navigate("/dashboard")
  }

  return (
    <Flex direction="column" className="min-h-screen bg-[var(--gray-2)]">
      <Flex
        justify="between"
        align="center"
        className="border-b border-[var(--gray-6)] px-6 py-3"
      >
        <Text size="4" weight="bold">
          Edit Profile
        </Text>
        <Button variant="soft" size="2" onClick={() => navigate("/dashboard")}>
          Back
        </Button>
      </Flex>

      <Flex direction="column" align="center" gap="4" className="px-4 py-8">
        <Card size="3" className="w-full max-w-lg">
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Slug
              </Text>
              <TextField.Root
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <Text size="1" color="gray">
                Your public URL: noshi.app/@{slug}
              </Text>
            </Flex>

            <Flex direction="column" gap="1">
              <Text as="label" size="2" weight="medium">
                Headline
              </Text>
              <TextField.Root
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="2" weight="medium">
                Niches
              </Text>
              <Flex wrap="wrap" gap="2">
                {NICHES.map((niche) => (
                  <Badge
                    key={niche}
                    size="2"
                    variant={niches.includes(niche) ? "solid" : "outline"}
                    color={niches.includes(niche) ? "iris" : "gray"}
                    className="cursor-pointer select-none"
                    onClick={() => toggleNiche(niche)}
                  >
                    {niche}
                  </Badge>
                ))}
              </Flex>
            </Flex>

            <Flex justify="between" align="center">
              <Flex direction="column" gap="0">
                <Text size="2" weight="medium">
                  Published
                </Text>
                <Text size="1" color="gray">
                  Make your profile visible to brands
                </Text>
              </Flex>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </Flex>

            <Button
              size="3"
              onClick={handleSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save changes"}
            </Button>

            {updateProfile.isError && (
              <Text size="2" color="red">
                Failed to update profile
              </Text>
            )}
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}

export default ProfileEditPage
