import type { CommunityPrompt } from "./types";

export const communityPrompts: CommunityPrompt[] = [
  {
    id: "comm-1",
    title: "Ultimate Code Review Assistant",
    description:
      "Comprehensive code review prompt that catches bugs, suggests improvements, and ensures best practices. Perfect for thorough PR reviews.",
    content: `Review this code thoroughly and provide comprehensive feedback.

## Analysis Framework

1. **Bug Detection**
   - Check for potential null/undefined errors
   - Look for off-by-one errors
   - Identify race conditions
   - Find memory leaks

2. **Security Review**
   - SQL injection vulnerabilities
   - XSS attack vectors
   - Authentication/authorization issues
   - Sensitive data exposure

3. **Performance Analysis**
   - Identify N+1 queries
   - Check for unnecessary re-renders
   - Look for memory-intensive operations
   - Suggest caching opportunities

4. **Code Quality**
   - Naming conventions
   - Function complexity
   - DRY principle violations
   - SOLID principle adherence

5. **Best Practices**
   - Error handling patterns
   - Logging practices
   - Testing coverage
   - Documentation quality

For each issue found, provide:
- Line number/location
- Severity (critical/warning/suggestion)
- Clear explanation of the problem
- Specific code fix recommendation`,
    category: "automation",
    tags: ["code-review", "best-practices", "debugging", "security", "performance"],
    author: {
      id: "user-1",
      username: "codewizard",
      displayName: "Code Wizard",
      avatarUrl: null,
      reputation: 1250,
    },
    stats: {
      views: 3420,
      copies: 892,
      saves: 234,
      rating: 4.8,
      ratingCount: 156,
    },
    featured: true,
    createdAt: "2026-01-10T12:00:00Z",
    updatedAt: "2026-01-11T08:30:00Z",
  },
  {
    id: "comm-2",
    title: "Creative Story Generator",
    description: "Generate engaging short stories with compelling characters and plot twists.",
    content:
      "Write a creative short story with the following elements: [GENRE], [SETTING], [MAIN CHARACTER]. Include: an engaging hook, rising tension, a surprising twist, and a satisfying conclusion. Use vivid imagery and dialogue.",
    category: "ideation",
    tags: ["creative-writing", "storytelling", "fiction"],
    author: {
      id: "user-2",
      username: "storysmith",
      displayName: "Story Smith",
      avatarUrl: null,
      reputation: 890,
    },
    stats: {
      views: 2150,
      copies: 567,
      saves: 189,
      rating: 4.6,
      ratingCount: 98,
    },
    featured: false,
    createdAt: "2026-01-09T15:30:00Z",
    updatedAt: "2026-01-09T15:30:00Z",
  },
  {
    id: "comm-3",
    title: "API Documentation Writer",
    description: "Generate comprehensive API documentation from code or specifications.",
    content:
      "Create detailed API documentation for the following endpoint/function. Include: endpoint URL, HTTP method, request parameters (with types and validation), response format, error codes, authentication requirements, rate limits, and 2-3 example requests with responses.",
    category: "documentation",
    tags: ["api", "docs", "technical-writing"],
    author: {
      id: "user-3",
      username: "docmaster",
      displayName: "Doc Master",
      avatarUrl: null,
      reputation: 1567,
    },
    stats: {
      views: 4890,
      copies: 1234,
      saves: 456,
      rating: 4.9,
      ratingCount: 234,
    },
    featured: true,
    createdAt: "2026-01-08T09:00:00Z",
    updatedAt: "2026-01-10T14:20:00Z",
  },
  {
    id: "comm-4",
    title: "Bug Hunter Pro",
    description: "Systematic bug detection prompt that finds hidden issues in your code.",
    content:
      "Analyze this code for bugs using a systematic approach: 1) Trace all execution paths, 2) Check boundary conditions, 3) Verify null/undefined handling, 4) Look for race conditions, 5) Check resource leaks, 6) Verify error propagation. For each bug found, explain the issue and provide a fix.",
    category: "debugging",
    tags: ["debugging", "bug-fixing", "code-analysis"],
    author: {
      id: "user-4",
      username: "bughunter",
      displayName: "Bug Hunter",
      avatarUrl: null,
      reputation: 2100,
    },
    stats: {
      views: 5670,
      copies: 1890,
      saves: 678,
      rating: 4.7,
      ratingCount: 312,
    },
    featured: false,
    createdAt: "2026-01-07T11:45:00Z",
    updatedAt: "2026-01-11T16:00:00Z",
  },
  {
    id: "comm-5",
    title: "Test Case Generator",
    description: "Generate comprehensive test cases for any function or feature.",
    content:
      "Generate test cases for the following code/feature. Include: 1) Happy path tests, 2) Edge cases, 3) Error scenarios, 4) Boundary conditions, 5) Integration points. For each test, provide: test name, input, expected output, and assertion logic.",
    category: "testing",
    tags: ["testing", "unit-tests", "qa"],
    author: {
      id: "user-5",
      username: "testguru",
      displayName: "Test Guru",
      avatarUrl: null,
      reputation: 1890,
    },
    stats: {
      views: 3210,
      copies: 987,
      saves: 345,
      rating: 4.5,
      ratingCount: 187,
    },
    featured: false,
    createdAt: "2026-01-06T14:20:00Z",
    updatedAt: "2026-01-06T14:20:00Z",
  },
  {
    id: "comm-6",
    title: "Refactoring Advisor",
    description:
      "Get expert advice on how to refactor messy code into clean, maintainable patterns.",
    content:
      "Analyze this code and suggest refactoring improvements. Focus on: 1) Reducing complexity, 2) Improving naming, 3) Extracting reusable functions, 4) Applying design patterns where appropriate, 5) Reducing duplication. Provide before/after examples for each suggestion.",
    category: "refactoring",
    tags: ["refactoring", "clean-code", "design-patterns"],
    author: {
      id: "user-6",
      username: "cleancode",
      displayName: "Clean Coder",
      avatarUrl: null,
      reputation: 1456,
    },
    stats: {
      views: 2890,
      copies: 756,
      saves: 267,
      rating: 4.8,
      ratingCount: 145,
    },
    featured: true,
    createdAt: "2026-01-05T10:15:00Z",
    updatedAt: "2026-01-09T11:30:00Z",
  },
];

const communityPromptMap = new Map(communityPrompts.map((prompt) => [prompt.id, prompt]));

export function getCommunityPrompt(id: string): CommunityPrompt | null {
  return communityPromptMap.get(id) ?? null;
}

export function getRelatedCommunityPrompts(id: string, limit = 2): CommunityPrompt[] {
  const prompt = getCommunityPrompt(id);
  if (!prompt) return [];

  return communityPrompts
    .filter((candidate) => candidate.id !== id)
    .sort((left, right) => {
      const leftCategoryMatch = Number(left.category === prompt.category);
      const rightCategoryMatch = Number(right.category === prompt.category);
      if (rightCategoryMatch !== leftCategoryMatch) {
        return rightCategoryMatch - leftCategoryMatch;
      }

      return right.stats.rating - left.stats.rating;
    })
    .slice(0, limit);
}
