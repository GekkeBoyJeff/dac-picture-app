import { test, expect } from "@playwright/test"

const PROFILE_KEY = "dac-picture-app-device-profile-v2"

// Inject a fake camera stream before each test so the app
// doesn't hang waiting for getUserMedia
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#333"
    ctx.fillRect(0, 0, 640, 480)
    const stream = canvas.captureStream(10)

    navigator.mediaDevices.getUserMedia = async () => stream
    navigator.mediaDevices.enumerateDevices = async () => [
      { kind: "videoinput", deviceId: "fake", label: "Fake Camera", groupId: "1" },
    ]
  })
})

test("first run shows device profile gate", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Draait deze photobooth op een Raspberry Pi?" })).toBeVisible({ timeout: 10000 })
})

test("choosing standard profile continues to camera", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Nee, gewone pc of laptop/i }).click()
  const captureBtn = page.locator('button[aria-label="Maak foto"]')
  await expect(captureBtn).toBeVisible({ timeout: 15000 })
})

test("choosing Raspberry Pi profile stores preference and continues", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /Ja, Raspberry Pi/i }).click()
  await expect(page.locator('button[aria-label="Maak foto"]')).toBeVisible({ timeout: 15000 })

  const stored = await page.evaluate((key) => window.localStorage.getItem(key), PROFILE_KEY)
  expect(stored).toBe("raspberry-pi")
})

test("returning user skips gate and can open settings", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "standard")
  }, PROFILE_KEY)

  await page.goto("/")
  const settingsBtn = page.locator('button[aria-label="Instellingen"]')
  await expect(settingsBtn).toBeVisible({ timeout: 15000 })

  await settingsBtn.click()
  await expect(page.locator("text=Handgebaren")).toBeVisible()

  await page.keyboard.press("Escape")
  // Drawer wrapper goes to opacity-0 + pointer-events-none when closed
  const wrapper = page.locator('[role="dialog"][aria-label="Instellingen"]').locator("..")
  await expect(wrapper).toHaveClass(/pointer-events-none/, { timeout: 5000 })
})

test("permission denied shows camera issue overlay", async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "standard")

    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError")
    }
  }, PROFILE_KEY)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Camera-toestemming nodig" })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole("button", { name: "Opnieuw proberen" })).toBeVisible()
})