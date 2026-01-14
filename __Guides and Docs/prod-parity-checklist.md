## Production Parity Checklist (MUST PASS)

- [ ] Dev proxy configured (`vite.config.ts`)
- [ ] Backend runs independently of frontend
- [ ] No frontend code assumes proxy exists in production
- [ ] API base is configurable via env
- [ ] All API responses validated as JSON
- [ ] Frontend build tested without dev server
- [ ] Reverse proxy / rewrites exist in production
- [ ] No hardcoded localhost URLs