import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getReviewById,
  submitAuthorResponse,
  deleteAuthorResponse,
  RESPONSE_MAX_LENGTH,
} from "@/lib/reviews/review-store";
import { getUserIdFromRequest } from "@/lib/user-id";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reviews/[id]/respond
 *
 * Add or update an author response to a review
 *
 * Body:
 * - content: string (response text, max 1000 chars)
 *
 * Note: In a production system, you would verify that the current user
 * is actually the author of the content being reviewed. For this MVP,
 * we'll use a simple check based on a header or environment variable.
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const { id: reviewId } = await context.params;
  const userId = getUserIdFromRequest(request);

  if (!reviewId) {
    return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const review = getReviewById(reviewId);

  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  // For MVP: Allow the content author to respond
  // In production, verify the user is the actual content author
  // For now, we'll use a simple header check or allow any authenticated user
  // to respond (simulating author functionality)
  const authorHeader = request.headers.get("x-content-author-id");
  const isAuthor = authorHeader === userId || process.env.NODE_ENV === "development";

  if (!isAuthor) {
    return NextResponse.json(
      { error: "Only the content author can respond to reviews." },
      { status: 403 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const content = typeof payload.content === "string" ? payload.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Response content is required." }, { status: 400 });
  }

  if (content.length < 5) {
    return NextResponse.json(
      { error: "Response must be at least 5 characters." },
      { status: 400 }
    );
  }

  if (content.length > RESPONSE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `Response exceeds maximum length of ${RESPONSE_MAX_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const result = submitAuthorResponse({
    reviewId,
    authorId: userId,
    content,
  });

  if (!result) {
    return NextResponse.json({ error: "Failed to submit response." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    review: result.review,
    response: result.response,
  });
}

/**
 * DELETE /api/reviews/[id]/respond
 *
 * Delete an author response
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { id: reviewId } = await context.params;
  const userId = getUserIdFromRequest(request);

  if (!reviewId) {
    return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const review = getReviewById(reviewId);

  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  if (!review.authorResponse) {
    return NextResponse.json({ error: "No response to delete." }, { status: 404 });
  }

  if (review.authorResponse.authorId !== userId) {
    return NextResponse.json(
      { error: "You can only delete your own responses." },
      { status: 403 }
    );
  }

  const success = deleteAuthorResponse({
    reviewId,
    authorId: userId,
  });

  if (!success) {
    return NextResponse.json({ error: "Failed to delete response." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
