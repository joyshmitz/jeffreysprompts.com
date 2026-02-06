//! Embedded fallback prompts
//!
//! When network and cache are unavailable, these bundled prompts
//! ensure basic functionality.

use crate::types::Prompt;

/// Get bundled prompts as fallback
pub fn bundled_prompts() -> Vec<Prompt> {
    vec![
        Prompt {
            id: "code-review".to_string(),
            title: "Code Review Assistant".to_string(),
            content: r#"Review this code for:
1. Bugs and potential issues
2. Performance problems
3. Security vulnerabilities
4. Code style and readability
5. Best practices

Code to review:
{{CODE}}

Provide specific, actionable feedback."#
                .to_string(),
            description: Some("Comprehensive code review with actionable feedback".to_string()),
            category: Some("debugging".to_string()),
            tags: vec!["review".to_string(), "quality".to_string()],
            variables: vec![],
            featured: true,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "explain-code".to_string(),
            title: "Code Explainer".to_string(),
            content: r#"Explain this code in detail:

{{CODE}}

Include:
- What the code does overall
- Key functions/methods and their purposes
- Important data structures
- Any notable patterns or techniques used"#
                .to_string(),
            description: Some("Get clear explanations of complex code".to_string()),
            category: Some("documentation".to_string()),
            tags: vec!["explain".to_string(), "learning".to_string()],
            variables: vec![],
            featured: true,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "write-tests".to_string(),
            title: "Test Generator".to_string(),
            content: r#"Write comprehensive tests for this code:

{{CODE}}

Requirements:
- Cover edge cases
- Include both positive and negative test cases
- Use appropriate testing patterns
- Add meaningful test descriptions"#
                .to_string(),
            description: Some("Generate comprehensive test suites".to_string()),
            category: Some("testing".to_string()),
            tags: vec!["tests".to_string(), "quality".to_string()],
            variables: vec![],
            featured: true,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "refactor".to_string(),
            title: "Refactoring Assistant".to_string(),
            content: r#"Refactor this code to improve:
- Readability
- Maintainability
- Performance (where applicable)
- Adherence to {{LANGUAGE}} best practices

Code to refactor:
{{CODE}}

Explain each change you make."#
                .to_string(),
            description: Some("Get suggestions for cleaner, better code".to_string()),
            category: Some("refactoring".to_string()),
            tags: vec!["refactor".to_string(), "clean-code".to_string()],
            variables: vec![],
            featured: false,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "debug".to_string(),
            title: "Debug Helper".to_string(),
            content: r#"Help me debug this issue:

Error message:
{{ERROR}}

Relevant code:
{{CODE}}

What I've tried:
{{ATTEMPTS}}

Please:
1. Analyze the error
2. Identify likely causes
3. Suggest specific fixes
4. Explain why the fix works"#
                .to_string(),
            description: Some("Systematic debugging assistance".to_string()),
            category: Some("debugging".to_string()),
            tags: vec!["debug".to_string(), "troubleshoot".to_string()],
            variables: vec![],
            featured: true,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "documentation".to_string(),
            title: "Documentation Writer".to_string(),
            content: r#"Write documentation for this code:

{{CODE}}

Include:
- Overview/purpose
- Usage examples
- Parameter descriptions
- Return value documentation
- Any important notes or caveats"#
                .to_string(),
            description: Some("Generate clear, comprehensive documentation".to_string()),
            category: Some("documentation".to_string()),
            tags: vec!["docs".to_string(), "readme".to_string()],
            variables: vec![],
            featured: false,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "optimize".to_string(),
            title: "Performance Optimizer".to_string(),
            content: r#"Analyze and optimize this code for performance:

{{CODE}}

Focus on:
- Time complexity improvements
- Memory usage optimization
- I/O efficiency
- Caching opportunities
- Parallelization potential

Explain the performance impact of each change."#
                .to_string(),
            description: Some("Get performance optimization suggestions".to_string()),
            category: Some("refactoring".to_string()),
            tags: vec!["performance".to_string(), "optimization".to_string()],
            variables: vec![],
            featured: false,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
        Prompt {
            id: "api-design".to_string(),
            title: "API Design Review".to_string(),
            content: r#"Review this API design:

{{API_SPEC}}

Evaluate:
- RESTful principles adherence
- Naming conventions
- Error handling approach
- Versioning strategy
- Security considerations
- Documentation completeness

Suggest improvements for each area."#
                .to_string(),
            description: Some("Get expert API design feedback".to_string()),
            category: Some("ideation".to_string()),
            tags: vec!["api".to_string(), "design".to_string()],
            variables: vec![],
            featured: false,
            version: Some("1.0.0".to_string()),
            author: Some("JeffreysPrompts".to_string()),
            saved_at: None,
            is_local: false,
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bundled_prompts_not_empty() {
        let prompts = bundled_prompts();
        assert!(!prompts.is_empty());
    }

    #[test]
    fn test_bundled_prompts_have_required_fields() {
        for prompt in bundled_prompts() {
            assert!(!prompt.id.is_empty());
            assert!(!prompt.title.is_empty());
            assert!(!prompt.content.is_empty());
        }
    }

    #[test]
    fn test_featured_prompts_exist() {
        let prompts = bundled_prompts();
        let featured: Vec<_> = prompts.iter().filter(|p| p.featured).collect();
        assert!(!featured.is_empty());
    }
}
