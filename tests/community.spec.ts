import { test, expect } from "@playwright/test";

test("a community member can organize, edit, join, leave, and delete an event", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Better communities start with us." }),
  ).toBeVisible();
  await expect(
    page.getByText("No upcoming events yet.", { exact: false }),
  ).toBeVisible();

  await page.goto("/events/create");
  await page.getByRole("link", { name: "Log in to continue" }).click();
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await page
    .getByLabel("Full name")
    .filter({ visible: true })
    .fill("Community Organizer");
  await page
    .getByRole("main")
    .getByRole("textbox", { name: "Email address", exact: true })
    .fill("organizer@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill("Test-password-123");
  await page
    .getByLabel("Confirm password")
    .filter({ visible: true })
    .fill("Test-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/events\/create$/);

  await page
    .getByLabel("Event title")
    .filter({ visible: true })
    .fill("A greener neighborhood, together");
  await page
    .getByLabel("Event type")
    .filter({ visible: true })
    .selectOption("Plantation");
  await page
    .getByLabel("Thumbnail image URL")
    .filter({ visible: true })
    .fill("http://localhost:3010/image/heroimage.png");
  await page
    .getByLabel("Location", { exact: false })
    .filter({ visible: true })
    .fill("Community garden, Dhaka");
  const future = new Date(Date.now() + 7 * 86400000);
  await page
    .getByLabel("Event date and time")
    .filter({ visible: true })
    .fill(
      `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T10:00`,
    );
  await page.getByLabel("Duration").filter({ visible: true }).fill("2");
  await page
    .getByLabel("Description")
    .filter({ visible: true })
    .fill(
      "Join your neighbors for a morning of planting and caring for our community garden. Bring water, comfortable shoes, and a little enthusiasm.",
    );
  await page.getByRole("button", { name: "Publish event" }).click();
  await expect(
    page.getByRole("heading", {
      name: "A greener neighborhood, together",
      exact: true,
    }),
  ).toBeVisible();
  const eventUrl = page.url().split("?")[0];
  await page.getByRole("link", { name: "Edit event", exact: true }).click();
  await page
    .getByLabel("Event title")
    .filter({ visible: true })
    .fill("Plant a little hope, together");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/event-desktop.png",
    fullPage: true,
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.goto("/signup");
  await page
    .getByLabel("Full name")
    .filter({ visible: true })
    .fill("Community Volunteer");
  await page
    .getByRole("main")
    .getByRole("textbox", { name: "Email address", exact: true })
    .fill("volunteer@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill("Test-password-123");
  await page
    .getByLabel("Confirm password")
    .filter({ visible: true })
    .fill("Test-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/events$/);
  await page
    .getByLabel("Search events or locations")
    .filter({ visible: true })
    .fill("hope");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await page
    .getByLabel("Event type", { exact: true })
    .filter({ visible: true })
    .selectOption("Donation");
  await expect(
    page.getByRole("heading", { name: "No events match your search" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("link", { name: "View details", exact: true }).click();
  await page.getByRole("button", { name: "Join this event" }).click();
  await expect(
    page.getByRole("button", { name: "Leave event", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Leave event", exact: true }),
  ).toBeVisible();
  await page.goto("/joined-events");
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await page.goto(eventUrl);
  await page.getByRole("button", { name: "Leave event", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Join this event" }),
  ).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "My events", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My events", exact: true }),
  ).toBeVisible();
  for (const route of [
    "/",
    "/events",
    "/events/create",
    eventUrl,
    "/impact",
    "/joined-events",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "Community volunteers planting a young tree together in a park",
    ),
  ).toHaveJSProperty("complete", true);
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(
    page.getByRole("heading", { name: "Plant a little hope, together" }),
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "Community volunteers planting a young tree together in a park",
    ),
  ).toHaveJSProperty("complete", true);
  await page.screenshot({
    path: "test-results/home-mobile-dark.png",
    fullPage: true,
    caret: "initial",
  });
  await page
    .getByLabel("Email address", { exact: true })
    .filter({ visible: true })
    .fill("news@example.com");
  await page
    .getByRole("button", { name: "Subscribe to the mailing list" })
    .click();
  await expect(
    page.getByText("You're on the community mailing list. Thank you!"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await page.goto("/login");
  await page
    .getByRole("main")
    .getByRole("textbox", { name: "Email address", exact: true })
    .fill("organizer@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .filter({ visible: true })
    .fill("Test-password-123");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/events$/);
  await page.goto("/my-events");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete event", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your community together" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("an API outage shows a retry state instead of fabricated events", async ({
  page,
}) => {
  await page.route("http://localhost:8010/events?**", (route) => route.abort());
  await page.goto("/events");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "couldn't reach Togetherly",
  );
  await page.unroute("http://localhost:8010/events?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: /\d+ upcoming events?/ }),
  ).toBeVisible();
});
