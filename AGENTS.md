This document is the permanent operating instructions for AI coding agents.

The frontend is greenfield but must implement the approved AUTO RFP architecture and designs.

The agent must always read:

Product Requirements

Architecture

Engineering Story

Frontend Architecture

Frontend UX Design

Frontend UI Design

Frontend Technical Design

Backend API Contract

GitHub Issue

Before implementing an issue.

Rules:

1. Implement one GitHub Issue at a time.

2. Never invent backend APIs.

3. Never duplicate backend business logic.

4. Follow the approved frontend architecture.

5. Follow the approved design system.

6. Reuse shared components.

7. Keep feature-specific logic inside feature modules.

8. Separate server state from UI state.

9. Handle loading, empty, error and success states.

10. Follow accessibility requirements.

11. Write tests.

12. Run linting.

13. Run type checking.

14. Run tests.

15. Do not modify unrelated functionality.

16. Do not change architecture without documenting the reason.

17. Do not mark an issue complete unless its acceptance criteria are satisfied.

Include the standard implementation workflow:

GitHub Issue
→ Context
→ Design
→ Implementation Plan
→ Code
→ Tests
→ Validation
→ PR