# Wolf Project - Claude Developer Notes

## Deployment Workflow

**IMPORTANT**: This is fundamental to our development workflow.

- **Commits to `main` trigger automatic build and deploy**
- **Deployed site**: https://wolf.topangasoft.workers.dev

### Key Points

- Any code merged or committed to the main branch will automatically trigger the CI/CD pipeline
- Changes will be built and deployed to the production environment
- Always verify changes work correctly before merging to main
- The live site can be accessed at wolf.topangasoft.workers.dev to verify deployments
