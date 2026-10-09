<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep mobile and backoffice experiences in the same TanStack application with role-aware entry points, because both share NexoVital data and identity.
- Use Lovable Cloud with row-level policies for persistent user and hospital data, because medical workflows require tenant isolation.
- Render maps with Google Maps JavaScript using the public connector key; use authenticated server calls for any Places data.
- Keep shared visual roles in semantic CSS tokens and use the shared Button for controls, so mobile and institutional views remain visually consistent.
