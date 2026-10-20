# FoundIt — Antigravity Workflow Rules

These 12 workflow rules apply to the entire development lifecycle of the FoundIt project:

1. **Inspect before modifying**: Always inspect existing files, structure, and database states before proposing or making changes.
2. **Preserve existing work**: Never overwrite or delete existing code or assets without explaining why and obtaining explicit approval.
3. **No massive code dumps**: Work incrementally with small, clear, well-explained modifications.
4. **Small, testable phases**: Develop in bounded phases with clear acceptance criteria and verifiable checkpoints.
5. **Phase approval gates**: Do not proceed to the next phase until the current one passes its tests and receives explicit approval.
6. **Beginner-friendly explanations**: Explain technical concepts in clear language so that every design decision can be understood and explained during university evaluation.
7. **Strict dependency control**: Avoid unnecessary libraries or over-engineering. Ask before adding any new package.
8. **No secrets in repository**: Never hardcode credentials, connection strings, or JWT secrets. Store secrets only in `.env` files and commit strictly `.env.example`.
9. **Continuous testing**: Run relevant tests and sanity checks after each phase and sub-gate.
10. **Phase summary reporting**: Report changed files, what was tested, test results, and any remaining open issues after each phase.
11. **Clarify ambiguities early**: Ask before assuming anything important, ambiguous, or underspecified.
12. **Maintain progress checklist**: Keep `docs/PROGRESS.md` continuously updated at the end of each phase.

## Additional Safety Rules
- Ask before running any command that deletes files, rewrites Git history, or touches anything outside the workspace.
- Do not build Recommended or Advanced features unless explicitly approved.
