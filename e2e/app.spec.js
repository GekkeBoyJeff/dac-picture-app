import { test, expect } from "@playwright/test"

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

test("app loads and shows splash", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("text=Photo Booth")).toBeVisible({ timeout: 10000 })
})

test("app shows capture button after splash", async ({ page }) => {
  await page.goto("/")
  const captureBtn = page.locator('button[aria-label="Maak foto"]')
  await expect(captureBtn).toBeVisible({ timeout: 15000 })
})

test("settings drawer opens and closes", async ({ page }) => {
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