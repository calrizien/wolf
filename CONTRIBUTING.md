# Contributing to QuoteJourney

Thank you for your interest in contributing to QuoteJourney! This document provides guidelines for contributing to the project.

## 🎯 Project Status

QuoteJourney was built for the TanStack Start + Convex Hackathon (Nov 2024). While the hackathon is time-limited, contributions are welcome for future improvements!

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account (free at https://convex.dev)
- Cloudflare account (for AI features)

### Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/wolf.git
cd wolf
```

2. Install dependencies:
```bash
npm install
```

3. Set up Convex:
```bash
npx convex dev
```

4. Seed the database:
```javascript
// In Convex dashboard, run:
scraping.seedDatabase()
```

5. Start development server:
```bash
npm run dev
```

## 📁 Project Structure

```
wolf/
├── convex/              # Backend (Convex)
│   ├── schema.ts       # Database schema
│   ├── quotes.ts       # Quote queries/mutations
│   ├── journeys.ts     # Journey tracking
│   ├── favorites.ts    # User preferences
│   ├── ai.ts          # Cloudflare AI integration
│   └── scraping.ts    # Quote seeding
├── src/
│   ├── components/     # Reusable React components
│   ├── routes/        # TanStack Start routes
│   └── styles/        # Tailwind CSS
└── docs/              # Documentation
```

## 🎨 Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use interfaces for component props

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Use Suspense for loading states
- Implement error boundaries

### CSS/Tailwind

- Use Tailwind utility classes
- Custom animations in `app.css`
- Follow mobile-first approach
- Support dark mode

### Convex

- Use proper validators (`v.*`)
- Write descriptive function names
- Add comments for complex queries
- Use indexes for performance

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, Node version
6. **Screenshots**: If applicable

## ✨ Feature Requests

For new features:

1. **Use Case**: Why is this feature needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other approaches considered
4. **Impact**: How does this benefit users?

## 🔧 Pull Requests

### Before Submitting

- [ ] Code follows project style
- [ ] All tests pass (if applicable)
- [ ] No console errors or warnings
- [ ] Tested in both light and dark mode
- [ ] Tested on mobile and desktop
- [ ] Documentation updated (if needed)

### PR Guidelines

1. **Branch Name**: `feature/description` or `fix/description`
2. **Commit Messages**: Clear, descriptive messages
3. **Description**: Explain what and why
4. **Screenshots**: For UI changes
5. **Testing**: Describe how you tested

### Commit Message Format

```
type: Brief description

Longer description if needed

- Bullet points for changes
- Keep it clear and concise
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🎯 Priority Areas

Looking for contributions in:

### High Priority
- [ ] More curated quotes (with proper attribution)
- [ ] Additional quote categories
- [ ] Performance optimizations
- [ ] Mobile UX improvements

### Medium Priority
- [ ] Sound effects for interactions
- [ ] Journey history visualization
- [ ] Quote sharing functionality
- [ ] Social features

### Low Priority
- [ ] Additional animation variants
- [ ] Theme customization
- [ ] Keyboard shortcuts
- [ ] Accessibility enhancements

## 🧪 Testing

### Manual Testing Checklist

- [ ] Landing page loads correctly
- [ ] Quote cards are interactive
- [ ] Journey navigation works
- [ ] AI recommendations load (with credentials)
- [ ] Fallback works (without AI credentials)
- [ ] Loading states appear correctly
- [ ] Error boundaries catch errors
- [ ] 404 page displays properly
- [ ] Dark mode works throughout
- [ ] Mobile responsive on all pages

### Browser Testing

Test on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

When adding features:

1. Update relevant docs in `/docs`
2. Add JSDoc comments for complex functions
3. Update README if user-facing
4. Add inline comments for tricky code

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Give credit where due

## 🎓 Learning Resources

### TanStack Start
- Docs: https://tanstack.com/start
- Examples: https://github.com/TanStack/router

### Convex
- Docs: https://docs.convex.dev
- Discord: https://www.convex.dev/community

### Cloudflare Workers & AI
- Workers: https://developers.cloudflare.com/workers
- AI: https://developers.cloudflare.com/workers-ai

## 💬 Questions?

- Open an issue for questions
- Check existing issues first
- Be clear and specific
- Provide context

## 🙏 Thank You!

Every contribution helps make QuoteJourney better. Whether it's:
- Reporting a bug
- Suggesting a feature
- Improving documentation
- Writing code

Your involvement is appreciated! 💙

---

**Happy Contributing!** ✨
