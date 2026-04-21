# Product Increment Guideline

## The Core Principle

Before merging a PR, ask:

> **"What can someone do now that they couldn't do before?"**

If there is no clear answer, the change is likely incomplete.

## What A Complete Increment Looks Like

A PR should deliver a visible, testable improvement, not just a partial step toward one.

Every non-trivial change should have:

1. **An observable outcome**: something changed in userscript UI, card-flow behavior, mock-testbed behavior, stats behavior, generated artifact checks, CI, or documentation clarity.
2. **An entry point**: a Tampermonkey action, browser-console path, mock-stand page, script command, or automated test that exercises the behavior.
3. **A manual test path**: concrete steps to verify it works, including the expected result.

Prefer vertical slices. A small change that reaches the userscript UI, mock script, and tests is usually more useful than a large preparatory layer with no reachable behavior.

## PR Description Structure

Use this structure for feature PRs:

```markdown
## What changed (technical)
Brief description of the implementation.

## What you can do now
Concrete new capability from the player's, tester's, or maintainer's perspective.

## How to test
1. Open / install / run ...
2. ...
Expected: ...
```

Pure refactors and documentation-only PRs may abbreviate this, but should still state what behavior is preserved.

## Allowed Exceptions

Some PRs cannot deliver a full product increment. That is acceptable only when explicitly stated.

| Type | Acceptable | Required in PR description |
| --- | --- | --- |
| Refactoring | Yes | State what behavior is preserved |
| Infrastructure / CI | Yes | State what it enables |
| Documentation | Yes | State what workflow becomes clearer |
| Preparatory interface/config work | Sometimes | State exactly which follow-up PR closes the loop |

Preparatory-only PRs should be rare. If several appear in a row, split the feature differently and deliver a smaller complete slice.

## Warning Signs

Flag these before merging:

- New userscript logic with no Tampermonkey or mock-testbed path to exercise it.
- Mock-only changes that do not regenerate or verify `collection.mock.user.js`.
- New UI copy scattered directly in runtime logic instead of `MESSAGES`, `UI_COPY`, or mock config.
- Stats integration changes that cannot be tested through connect/send/dashboard flow.
- New behavior that changes gameplay request timing without explicit design review.

If new behavior cannot be tested through the live page safely, add or use a mock-testbed path and automated helper tests. That counts as an entry point.

## Summary

> A merged change = a real, usable improvement at that point in time.

The script and mock stand should be testable and coherent at every commit on `main`, not only at a future milestone.
