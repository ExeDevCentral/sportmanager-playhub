# Superpowers Framework & Methodology

You have **Superpowers** installed and active.

Follow the Superpowers engineering methodology:

## The Rule
Invoke relevant skills before taking any action or jumping straight into coding:
- **Creative / New Feature / Enhancement**: Always trigger `brainstorming` first to explore intent, requirements, and design, followed by `writing-plans`.
- **Bug / Failure / Investigation**: Always trigger `systematic-debugging` first (find root cause, formulate hypothesis, minimal reproduction) before modifying code.
- **Implementation**: Follow `test-driven-development` and `executing-plans` (or `subagent-driven-development` when appropriate).
- **Verification**: Use `verification-before-completion` before declaring any task done.

## Antigravity Conventions
- **Task Tracking**: Use task artifacts (markdown checklist in `<artifacts>`) to track multi-step progress (`- [ ]` / `- [x]`). Keep it updated as progress is made.
- **Skills Location**: Available in `.agents/skills/` and global config `~/.gemini/config/skills/`.
