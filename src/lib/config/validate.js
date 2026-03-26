import { CONVENTIONS, LAYOUTS, MASCOTS } from "./presets"

const BREAKPOINTS = ["sm", "md", "lg"]

function hasKeys(value, keys) {
  return value && typeof value === "object" && keys.every((key) => key in value)
}

function hasBreakpointObject(value) {
  return hasKeys(value, BREAKPOINTS)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function validateConvention(item, index) {
  assert(typeof item.slug === "string", `Convention[${index}] missing slug`)
  assert(typeof item.name === "string", `Convention[${index}] missing name`)
  assert(typeof item.startDate === "string", `Convention[${index}] missing startDate`)
  assert(typeof item.endDate === "string", `Convention[${index}] missing endDate`)
  assert(typeof item.bannerPath === "string", `Convention[${index}] missing bannerPath`)
  assert(hasBreakpointObject(item.sizes), `Convention[${index}] missing sizes.{sm,md,lg}`)
}

function validateMascot(item, index) {
  assert(typeof item.id === "string", `Mascot[${index}] missing id`)
  assert(typeof item.name === "string", `Mascot[${index}] missing name`)
  assert(typeof item.path === "string", `Mascot[${index}] missing path`)
  assert(typeof item.thumbnail === "string", `Mascot[${index}] missing thumbnail`)
}

function validateLayout(item, index) {
  assert(typeof item.id === "string", `Layout[${index}] missing id`)
  assert(typeof item.name === "string", `Layout[${index}] missing name`)
  assert(hasBreakpointObject(item.inset), `Layout[${index}] missing inset.{sm,md,lg}`)
  assert(item.logo?.position, `Layout[${index}] missing logo.position`)
  assert(hasBreakpointObject(item.logo?.size), `Layout[${index}] missing logo.size.{sm,md,lg}`)
  assert(item.mascot?.position, `Layout[${index}] missing mascot.position`)
  assert(hasBreakpointObject(item.mascot?.sizes), `Layout[${index}] missing mascot.sizes.{sm,md,lg}`)
  assert(item.convention?.position, `Layout[${index}] missing convention.position`)
  assert(hasBreakpointObject(item.title?.fontSize), `Layout[${index}] missing title.fontSize.{sm,md,lg}`)
  assert(item.qr?.position, `Layout[${index}] missing qr.position`)
  assert(hasBreakpointObject(item.qr?.size), `Layout[${index}] missing qr.size.{sm,md,lg}`)
}

export function validateConfigShapes() {
  if (process.env.NODE_ENV === "production") return true

  try {
    assert(Array.isArray(CONVENTIONS), "CONVENTIONS must be an array")
    assert(Array.isArray(MASCOTS), "MASCOTS must be an array")
    assert(Array.isArray(LAYOUTS), "LAYOUTS must be an array")

    CONVENTIONS.forEach(validateConvention)
    MASCOTS.forEach(validateMascot)
    LAYOUTS.forEach(validateLayout)

    return true
  } catch (error) {
    console.warn("[config validation]", error instanceof Error ? error.message : "Invalid config")
    return false
  }
}