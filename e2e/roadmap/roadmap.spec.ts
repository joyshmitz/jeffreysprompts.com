import { test, expect } from "../lib/playwright-logger";
import {
  gotoRoadmap,
  gotoFeatureDetail,
  gotoFeatureSubmit,
  getRoadmapHeader,
  getStatsCards,
  getSubmitButton,
  getFeatureCards,
  getFeatureCard,
  getFeatureCardByTitle,
  getShippedSection,
  getDeclinedSection,
  expandDeclinedSection,
  getFeatureTitle,
  getFeatureDescription,
  getVoteButton,
  getVoteCountDisplay,
  getCommentsSection,
  getBackToRoadmapLink,
  getTitleInput,
  getDescriptionTextarea,
  getUseCaseTextarea,
  getSubmitFormButton,
  getCancelButton,
  getSubmissionGuidelines,
  assertRoadmapPageLoaded,
  assertFeatureDetailLoaded,
  assertSubmitFormLoaded,
  voteForFeature,
  submitFeatureRequest,
  SEED_FEATURES,
} from "../lib/roadmap-helpers";

/**
 * Roadmap E2E Tests - Public Roadmap & Feature Voting
 *
 * Tests the public roadmap, feature detail pages, voting, and feature submission.
 * Covers: viewing roadmap, voting, duplicate vote prevention, feature submission.
 */

test.setTimeout(60000);

test.describe("Roadmap - Public Roadmap Page", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to roadmap page", async () => {
      await gotoRoadmap(page);
    });
  });

  test("displays roadmap page header and stats", async ({ page, logger }) => {
    await logger.step("verify page header", async () => {
      await expect(getRoadmapHeader(page)).toBeVisible();
      await expect(page.getByText(/see what we're building/i)).toBeVisible();
    });

    await logger.step("verify stats cards are present", async () => {
      const statsCards = getStatsCards(page);
      await expect(statsCards).toHaveCount(4);
    });

    await logger.step("verify total features stat", async () => {
      await expect(page.getByText("Total Features")).toBeVisible();
    });

    await logger.step("verify in progress stat", async () => {
      await expect(page.getByText("In Progress").first()).toBeVisible();
    });

    await logger.step("verify shipped stat", async () => {
      await expect(page.getByText("Shipped").first()).toBeVisible();
    });

    await logger.step("verify total votes stat", async () => {
      await expect(page.getByText("Total Votes")).toBeVisible();
    });
  });

  test("displays submit feature request button", async ({ page, logger }) => {
    await logger.step("verify submit button is visible", async () => {
      const submitButton = getSubmitButton(page);
      await expect(submitButton).toBeVisible();
    });

    await logger.step("verify submit button links to submit page", async () => {
      const submitButton = getSubmitButton(page);
      await expect(submitButton).toHaveAttribute("href", "/roadmap/submit");
    });
  });

  test("displays feature cards with correct information", async ({ page, logger }) => {
    await logger.step("verify feature cards are present", async () => {
      const featureCards = getFeatureCards(page);
      await expect(featureCards.first()).toBeVisible();
    });

    await logger.step("verify feature card shows vote count", async () => {
      const firstCard = getFeatureCards(page).first();
      await expect(firstCard.getByText(/votes/i)).toBeVisible();
    });

    await logger.step("verify feature card shows status badge", async () => {
      const firstCard = getFeatureCards(page).first();
      // Should have one of the status badges
      await expect(firstCard.locator("text=/In Progress|Planned|Under Review|Shipped|Declined/")).toBeVisible();
    });
  });

  test("displays recently shipped section with shipped features", async ({ page, logger }) => {
    await logger.step("verify shipped section exists", async () => {
      await expect(page.getByText("Recently Shipped")).toBeVisible();
    });

    await logger.step("verify dark mode feature is in shipped section", async () => {
      // Dark mode (feat-001) is shipped in seed data
      await expect(page.getByText("Dark Mode Support")).toBeVisible();
    });
  });

  test("displays collapsed declined section", async ({ page, logger }) => {
    await logger.step("verify declined section exists and is collapsed", async () => {
      const declinedSection = getDeclinedSection(page);
      await expect(declinedSection).toBeVisible();
      // Check it's collapsed by verifying details is not open
      await expect(declinedSection).not.toHaveAttribute("open");
    });

    await logger.step("expand declined section", async () => {
      await expandDeclinedSection(page);
    });

    await logger.step("verify declined feature is visible after expanding", async () => {
      // Mobile App (feat-007) is declined in seed data
      await expect(page.getByText("Native Mobile App")).toBeVisible();
    });
  });

  test("feature cards are clickable and navigate to detail page", async ({ page, logger }) => {
    await logger.step("click on a feature card", async () => {
      const featureCard = getFeatureCard(page, SEED_FEATURES.promptVersionHistory);
      await featureCard.click();
    });

    await logger.step("verify navigation to feature detail page", async () => {
      await expect(page).toHaveURL(/\/roadmap\/feat-002/);
      await assertFeatureDetailLoaded(page);
    });
  });

  test("submit button navigates to submit page", async ({ page, logger }) => {
    await logger.step("click submit button", async () => {
      const submitButton = getSubmitButton(page);
      await submitButton.click();
    });

    await logger.step("verify navigation to submit page", async () => {
      await expect(page).toHaveURL(/\/roadmap\/submit/);
      await assertSubmitFormLoaded(page);
    });
  });
});

test.describe("Roadmap - Feature Detail Page", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to feature detail page", async () => {
      await gotoFeatureDetail(page, SEED_FEATURES.promptVersionHistory);
    });
  });

  test("displays feature detail with correct content", async ({ page, logger }) => {
    await logger.step("verify feature title", async () => {
      await expect(getFeatureTitle(page)).toHaveText(/Prompt Version History/i);
    });

    await logger.step("verify feature description", async () => {
      const description = getFeatureDescription(page);
      await expect(description).toBeVisible();
    });

    await logger.step("verify vote count display", async () => {
      await expect(getVoteCountDisplay(page)).toBeVisible();
    });

    await logger.step("verify status badge", async () => {
      await expect(page.getByText("In Progress")).toBeVisible();
    });
  });

  test("displays vote section with button and count", async ({ page, logger }) => {
    await logger.step("verify vote button is present", async () => {
      const voteButton = getVoteButton(page);
      await expect(voteButton).toBeVisible();
    });

    await logger.step("verify vote count is displayed", async () => {
      const voteCount = getVoteCountDisplay(page);
      await expect(voteCount).toBeVisible();
      // Seed data has 423 votes for this feature
      await expect(voteCount).toHaveText("423");
    });
  });

  test("displays comments section", async ({ page, logger }) => {
    await logger.step("verify comments section exists", async () => {
      await expect(page.getByText("Comments")).toBeVisible();
    });

    await logger.step("verify comment count is shown", async () => {
      // The header shows "Comments (N)"
      await expect(page.getByText(/Comments \(\d+\)/)).toBeVisible();
    });
  });

  test("displays use case section when available", async ({ page, logger }) => {
    await logger.step("verify use case section", async () => {
      await expect(page.getByText("Use Case")).toBeVisible();
    });
  });

  test("back link navigates to roadmap", async ({ page, logger }) => {
    await logger.step("click back to roadmap link", async () => {
      const backLink = getBackToRoadmapLink(page);
      await backLink.click();
    });

    await logger.step("verify navigation back to roadmap", async () => {
      await expect(page).toHaveURL(/\/roadmap$/);
      await assertRoadmapPageLoaded(page);
    });
  });
});

test.describe("Roadmap - Voting", () => {
  test("can vote for a feature and see count update", async ({ page, logger }) => {
    await logger.step("navigate to feature detail page", async () => {
      await gotoFeatureDetail(page, SEED_FEATURES.offlineMode);
    });

    await logger.step("get initial vote count", async () => {
      const voteCount = getVoteCountDisplay(page);
      await expect(voteCount).toHaveText("198");
    });

    await logger.step("click vote button", async () => {
      await voteForFeature(page);
    });

    await logger.step("verify vote count increased", async () => {
      const voteCount = getVoteCountDisplay(page);
      // Vote count should increase by 1
      await expect(voteCount).toHaveText("199");
    });
  });

  test("voting button is accessible via keyboard", async ({ page, logger }) => {
    await logger.step("navigate to feature detail page", async () => {
      await gotoFeatureDetail(page, SEED_FEATURES.customCategories);
    });

    await logger.step("focus vote button with keyboard", async () => {
      const voteButton = getVoteButton(page);
      await voteButton.focus();
      await expect(voteButton).toBeFocused();
    });

    await logger.step("verify vote button can be activated with Enter", async () => {
      await page.keyboard.press("Enter");
      // Vote should be registered
      const voteCount = getVoteCountDisplay(page);
      await expect(voteCount).toHaveText("157");
    });
  });

  test("prevents duplicate votes from same user via API", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.customCategories;
    const userId = `test-user-${Date.now()}`;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("first vote should succeed", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.voteCount).toBeGreaterThan(0);
    });

    await logger.step("duplicate vote should fail", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("vote_failed");
      expect(json.message).toBe("Already voted");
    });
  });

  test("prevents duplicate votes across multiple requests", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.analyticsInsights;
    const userId = `duplicate-test-${Date.now()}`;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("get initial vote count via API", async () => {
      const response = await page.request.get(`/api/roadmap/${featureId}?userId=${userId}`);
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.hasVoted).toBe(false);
    });

    await logger.step("submit first vote", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(true);
    });

    await logger.step("verify hasVoted is now true", async () => {
      const response = await page.request.get(`/api/roadmap/${featureId}?userId=${userId}`);
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.hasVoted).toBe(true);
    });

    await logger.step("second vote attempt should be rejected", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
    });
  });

  test("can remove vote via DELETE", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.importExport;
    const userId = `unvote-test-${Date.now()}`;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("vote for the feature", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(true);
    });

    await logger.step("remove vote via DELETE", async () => {
      const response = await page.request.delete(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.success).toBe(true);
    });

    await logger.step("verify can vote again after removing", async () => {
      const response = await page.request.post(`/api/roadmap/${featureId}/vote`, {
        data: { userId },
      });
      expect(response.ok()).toBe(true);
    });
  });
});

test.describe("Roadmap - Feature Submission", () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.step("navigate to submit page", async () => {
      await gotoFeatureSubmit(page);
    });
  });

  test("displays submission form with all fields", async ({ page, logger }) => {
    await logger.step("verify page header", async () => {
      await expect(page.getByRole("heading", { name: /submit.*feature.*request/i })).toBeVisible();
    });

    await logger.step("verify submission guidelines", async () => {
      await expect(page.getByText("Submission Guidelines")).toBeVisible();
    });

    await logger.step("verify title field", async () => {
      const titleInput = getTitleInput(page);
      await expect(titleInput).toBeVisible();
      await expect(titleInput).toHaveAttribute("required", "");
    });

    await logger.step("verify description field", async () => {
      const descriptionTextarea = getDescriptionTextarea(page);
      await expect(descriptionTextarea).toBeVisible();
      await expect(descriptionTextarea).toHaveAttribute("required", "");
    });

    await logger.step("verify use case field (optional)", async () => {
      const useCaseTextarea = getUseCaseTextarea(page);
      await expect(useCaseTextarea).toBeVisible();
    });

    await logger.step("verify submit button", async () => {
      const submitButton = getSubmitFormButton(page);
      await expect(submitButton).toBeVisible();
    });

    await logger.step("verify cancel button", async () => {
      const cancelButton = getCancelButton(page);
      await expect(cancelButton).toBeVisible();
    });
  });

  test("shows character count for title field", async ({ page, logger }) => {
    await logger.step("verify initial character count", async () => {
      await expect(page.getByText("0/100 characters")).toBeVisible();
    });

    await logger.step("type in title field", async () => {
      await getTitleInput(page).fill("Test feature title");
    });

    await logger.step("verify character count updates", async () => {
      await expect(page.getByText("18/100 characters")).toBeVisible();
    });
  });

  test("shows character count for description field", async ({ page, logger }) => {
    await logger.step("verify initial character count", async () => {
      await expect(page.getByText("0/2000 characters")).toBeVisible();
    });

    await logger.step("type in description field", async () => {
      await getDescriptionTextarea(page).fill("This is a test description for a feature");
    });

    await logger.step("verify character count updates", async () => {
      await expect(page.getByText("41/2000 characters")).toBeVisible();
    });
  });

  test("submit button is disabled when form is incomplete", async ({ page, logger }) => {
    await logger.step("verify submit button is initially disabled", async () => {
      const submitButton = getSubmitFormButton(page);
      await expect(submitButton).toBeDisabled();
    });

    await logger.step("fill only title", async () => {
      await getTitleInput(page).fill("Test Title");
    });

    await logger.step("verify submit button still disabled (description too short)", async () => {
      const submitButton = getSubmitFormButton(page);
      await expect(submitButton).toBeDisabled();
    });
  });

  test("submit button is enabled when form is complete", async ({ page, logger }) => {
    await logger.step("fill title with sufficient length", async () => {
      await getTitleInput(page).fill("Test Feature Title");
    });

    await logger.step("fill description with sufficient length", async () => {
      await getDescriptionTextarea(page).fill("This is a detailed description of the feature request that meets the minimum length requirement.");
    });

    await logger.step("verify submit button is enabled", async () => {
      const submitButton = getSubmitFormButton(page);
      await expect(submitButton).toBeEnabled();
    });
  });

  test("can submit a valid feature request", async ({ page, logger }) => {
    const testFeature = {
      title: "Integration with AI Tools",
      description: "Add support for integrating with various AI tools and APIs to enhance prompt generation and testing capabilities.",
      useCase: "Developers who use multiple AI services would benefit from being able to test prompts across different models.",
    };

    await logger.step("fill out form with valid data", async () => {
      await submitFeatureRequest(page, testFeature);
    });

    await logger.step("verify success state", async () => {
      // Success message should appear
      await expect(page.getByText(/feature submitted/i)).toBeVisible({ timeout: 10000 });
    });

    await logger.step("verify redirect to feature detail page", async () => {
      // Should redirect to the new feature's detail page
      await expect(page).toHaveURL(/\/roadmap\/feat-/, { timeout: 5000 });
    });
  });

  test("cancel button returns to roadmap", async ({ page, logger }) => {
    await logger.step("click cancel button", async () => {
      await getCancelButton(page).click();
    });

    await logger.step("verify navigation back to roadmap", async () => {
      await expect(page).toHaveURL(/\/roadmap/);
    });
  });

  test("back link returns to roadmap", async ({ page, logger }) => {
    await logger.step("click back to roadmap link", async () => {
      await getBackToRoadmapLink(page).click();
    });

    await logger.step("verify navigation to roadmap", async () => {
      await expect(page).toHaveURL(/\/roadmap$/);
    });
  });
});

test.describe("Roadmap - Accessibility", () => {
  test("roadmap page has proper heading structure", async ({ page, logger }) => {
    await logger.step("navigate to roadmap page", async () => {
      await gotoRoadmap(page);
    });

    await logger.step("verify h1 heading exists", async () => {
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(/product roadmap/i);
    });

    await logger.step("verify section headings exist", async () => {
      // Recently Shipped section heading
      await expect(page.getByRole("heading", { name: /recently shipped/i })).toBeVisible();
    });
  });

  test("feature detail page has proper heading structure", async ({ page, logger }) => {
    await logger.step("navigate to feature detail page", async () => {
      await gotoFeatureDetail(page, SEED_FEATURES.darkMode);
    });

    await logger.step("verify h1 heading exists", async () => {
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
    });

    await logger.step("verify comments section heading", async () => {
      await expect(page.getByRole("heading", { name: /comments/i })).toBeVisible();
    });
  });

  test("form fields have proper labels", async ({ page, logger }) => {
    await logger.step("navigate to submit page", async () => {
      await gotoFeatureSubmit(page);
    });

    await logger.step("verify title field has label", async () => {
      const label = page.getByText(/feature title/i);
      await expect(label).toBeVisible();
    });

    await logger.step("verify description field has label", async () => {
      const label = page.getByText(/description/i).first();
      await expect(label).toBeVisible();
    });

    await logger.step("verify use case field has label", async () => {
      const label = page.getByText(/use case/i);
      await expect(label).toBeVisible();
    });
  });

  test("interactive elements are keyboard accessible", async ({ page, logger }) => {
    await logger.step("navigate to roadmap page", async () => {
      await gotoRoadmap(page);
    });

    await logger.step("verify submit button is focusable", async () => {
      const submitButton = getSubmitButton(page);
      await submitButton.focus();
      await expect(submitButton).toBeFocused();
    });

    await logger.step("verify feature cards are focusable", async () => {
      const featureCard = getFeatureCards(page).first();
      await featureCard.focus();
      await expect(featureCard).toBeFocused();
    });
  });
});

test.describe("Roadmap - Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("roadmap page displays correctly on mobile", async ({ page, logger }) => {
    await logger.step("navigate to roadmap page", async () => {
      await gotoRoadmap(page);
    });

    await logger.step("verify header is visible", async () => {
      await expect(getRoadmapHeader(page)).toBeVisible();
    });

    await logger.step("verify stats cards are visible", async () => {
      // Stats should stack on mobile (grid-cols-2)
      const statsCards = getStatsCards(page);
      await expect(statsCards.first()).toBeVisible();
    });

    await logger.step("verify submit button is visible and tappable", async () => {
      const submitButton = getSubmitButton(page);
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeInViewport();
    });

    await logger.step("verify feature cards are visible", async () => {
      const featureCards = getFeatureCards(page);
      await expect(featureCards.first()).toBeVisible();
    });
  });

  test("feature detail page displays correctly on mobile", async ({ page, logger }) => {
    await logger.step("navigate to feature detail page", async () => {
      await gotoFeatureDetail(page, SEED_FEATURES.promptVersionHistory);
    });

    await logger.step("verify feature title is visible", async () => {
      await expect(getFeatureTitle(page)).toBeVisible();
    });

    await logger.step("verify vote section is visible", async () => {
      await expect(getVoteCountDisplay(page)).toBeVisible();
    });

    await logger.step("verify back link is visible", async () => {
      await expect(getBackToRoadmapLink(page)).toBeVisible();
    });
  });

  test("submit form displays correctly on mobile", async ({ page, logger }) => {
    await logger.step("navigate to submit page", async () => {
      await gotoFeatureSubmit(page);
    });

    await logger.step("verify form fields are visible and usable", async () => {
      await expect(getTitleInput(page)).toBeVisible();
      await expect(getDescriptionTextarea(page)).toBeVisible();
      await expect(getSubmitFormButton(page)).toBeVisible();
    });

    await logger.step("verify form can be filled on mobile", async () => {
      await getTitleInput(page).fill("Mobile test feature");
      await expect(getTitleInput(page)).toHaveValue("Mobile test feature");
    });
  });
});

test.describe("Roadmap - Admin Controls", () => {
  // These tests use the admin API with dev bypass enabled
  // In production, JFP_ADMIN_TOKEN would be required

  test("admin can update feature status via API", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.offlineMode;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("verify initial status is under_review", async () => {
      const response = await page.request.get(`/api/roadmap/${featureId}`);
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.feature.status).toBe("under_review");
    });

    await logger.step("admin updates status to declined", async () => {
      const response = await page.request.patch(`/api/admin/roadmap/${featureId}`, {
        data: {
          status: "declined",
          statusNote: "This feature won't be implemented due to technical constraints.",
        },
      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.feature.status).toBe("declined");
      expect(json.feature.statusNote).toContain("technical constraints");
    });

    await logger.step("verify feature now shows as declined", async () => {
      const response = await page.request.get(`/api/roadmap/${featureId}`);
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.feature.status).toBe("declined");
    });
  });

  test("admin can change feature status through lifecycle", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.apiAccess;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("verify initial status is planned", async () => {
      const response = await page.request.get(`/api/roadmap/${featureId}`);
      const json = await response.json();
      expect(json.feature.status).toBe("planned");
    });

    await logger.step("move to in_progress", async () => {
      const response = await page.request.patch(`/api/admin/roadmap/${featureId}`, {
        data: { status: "in_progress" },

      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.feature.status).toBe("in_progress");
    });

    await logger.step("mark as shipped", async () => {
      const response = await page.request.patch(`/api/admin/roadmap/${featureId}`, {
        data: { status: "shipped" },

      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.feature.status).toBe("shipped");
      expect(json.feature.shippedAt).toBeDefined();
    });
  });

  test("admin can set planned quarter when planning feature", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.analyticsInsights;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("set status to planned with quarter", async () => {
      const response = await page.request.patch(`/api/admin/roadmap/${featureId}`, {
        data: {
          status: "planned",
          plannedQuarter: "Q2 2026",
        },

      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.feature.status).toBe("planned");
      expect(json.feature.plannedQuarter).toBe("Q2 2026");
    });
  });

  test("rejects invalid status values", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.customCategories;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("attempt to set invalid status", async () => {
      const response = await page.request.patch(`/api/admin/roadmap/${featureId}`, {
        data: { status: "invalid_status" },

      });
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      const json = await response.json();
      expect(json.error).toBe("invalid_status");
    });
  });

  test("returns 404 for non-existent feature", async ({ page, logger }) => {
    await logger.step("navigate to roadmap page to initialize store", async () => {
      await gotoRoadmap(page);
    });

    await logger.step("attempt to update non-existent feature", async () => {
      const response = await page.request.patch("/api/admin/roadmap/feat-nonexistent", {
        data: { status: "declined" },

      });
      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(404);
      const json = await response.json();
      expect(json.error).toBe("not_found");
    });
  });

  test("admin can view feature with admin details", async ({ page, logger }) => {
    const featureId = SEED_FEATURES.promptVersionHistory;

    await logger.step("navigate to feature page to initialize store", async () => {
      await gotoFeatureDetail(page, featureId);
    });

    await logger.step("admin can fetch feature details", async () => {
      const response = await page.request.get(`/api/admin/roadmap/${featureId}`, {

      });
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.feature).toBeDefined();
      expect(json.feature.id).toBe(featureId);
      expect(json.adminRole).toBeDefined();
    });
  });
});
