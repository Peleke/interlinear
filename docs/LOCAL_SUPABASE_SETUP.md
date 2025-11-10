# Local Supabase Development Setup

**Why Local Supabase?**
- Test migrations safely before pushing to production
- Faster development cycle (no network latency)
- Work offline without remote database dependency
- Free local testing environment
- Exact production environment replica

## Prerequisites

You already have Docker installed (using it for the app). Supabase CLI uses Docker under the hood.

## Quick Start

### 1. Initialize Supabase (Already Done ✅)

Your project already has:
- `supabase/` directory with migrations
- `supabase/config.toml` configuration file

### 2. Start Local Supabase

```bash
npx supabase start
```

This will:
- Download Supabase Docker images (~2GB first time)
- Start PostgreSQL, PostgREST, GoTrue (auth), Realtime, Storage, etc.
- Run all your migrations automatically
- Give you connection details

**First-time setup takes ~5 minutes**. Subsequent starts take ~30 seconds.

### 3. Get Connection Details

After `supabase start`, you'll see:

```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: your-super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbG...
service_role key: eyJhbG...
```

### 4. Access Supabase Studio

Open **http://localhost:54323** in your browser.

This is your local version of Supabase Studio where you can:
- Browse tables and data
- Run SQL queries
- Test RLS policies
- View API logs
- Manage authentication

### 5. Update Your `.env.local`

Add local Supabase connection (keep production URLs commented out during local dev):

```env
# Local Supabase (for development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>

# Production Supabase (comment out during local dev)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
```

### 6. Restart Your Next.js App

```bash
npm run dev
```

Your app now connects to local Supabase! 🎉

## Common Workflows

### Testing New Migrations

1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Run locally:
   ```bash
   npx supabase db reset  # Resets DB and runs all migrations
   ```
3. Test in your app
4. Once working, push to production:
   ```bash
   npx supabase db push  # Pushes migrations to remote
   ```

### Resetting Local Database

```bash
npx supabase db reset
```

This:
- Drops all data
- Re-runs all migrations from scratch
- Gives you a clean slate

**Use this often!** It's fast and ensures migrations work from scratch.

### Stopping Supabase

```bash
npx supabase stop
```

Docker containers continue running in background but can be stopped anytime.

### Checking Status

```bash
npx supabase status
```

Shows all running services and connection details.

### Viewing Logs

```bash
npx supabase logs
npx supabase logs db       # Database logs only
npx supabase logs api      # API logs only
```

## Local vs Production Workflow

### Local Development (Recommended)
```bash
1. npx supabase start                    # Start local DB
2. Edit migration files                   # Make changes
3. npx supabase db reset                 # Test locally
4. npm run dev                           # Test in app
5. git commit                            # Commit when working
6. npx supabase db push                  # Push to production
```

### Direct Production (Current - Not Recommended)
```bash
1. Edit migration files
2. Run manually on production DB
3. Hope it works 🤞
```

## Configuration Files

### `supabase/config.toml`

Already configured! This file controls:
- Database settings
- API ports
- Authentication settings
- Storage configuration

**You shouldn't need to modify this** unless you want custom ports.

### Port Configuration

Default ports (can be changed in `config.toml`):
- **54321**: API (PostgREST, GoTrue, Storage, Edge Functions)
- **54322**: PostgreSQL direct connection
- **54323**: Supabase Studio
- **54324**: Email testing (Inbucket)

## Testing Your Setup

### Quick Test: Create Sample Data

```bash
# Start Supabase
npx supabase start

# Open Studio
open http://localhost:54323

# In Studio, run this SQL:
SELECT * FROM lessons LIMIT 5;
```

You should see your lessons table (empty or with test data).

### Test Migration

```bash
# Reset DB and run all migrations
npx supabase db reset

# Check the new ai_generations table
npx supabase db studio
# Then: Navigate to "Table Editor" → "ai_generations"
```

## Troubleshooting

### Port Already in Use
```bash
npx supabase stop
docker ps  # Check for any lingering containers
docker compose down  # Stop your app's Docker
npx supabase start
```

### Migration Errors
```bash
# View detailed error
npx supabase db reset --debug

# Common issue: Syntax error in migration file
# Fix: Check migration SQL syntax

# Common issue: Foreign key reference doesn't exist
# Fix: Ensure migrations run in order (check timestamps)
```

### Can't Connect from App
```bash
# Verify Supabase is running
npx supabase status

# Check your .env.local has correct values
cat .env.local | grep SUPABASE

# Restart Next.js
npm run dev
```

### Docker Disk Space
```bash
# Supabase images are ~2GB
# Clean up old images:
docker system prune -a
```

## Next Steps

1. **Run it now**:
   ```bash
   npx supabase start
   ```

2. **Test the ai_generations migration**:
   ```bash
   npx supabase db reset
   ```

3. **Open Studio and explore**:
   ```bash
   open http://localhost:54323
   ```

4. **Update .env.local** with local connection details

5. **Restart your app** and verify connection

## Benefits You'll See Immediately

✅ **Faster development**: No network latency
✅ **Safe testing**: Can't break production
✅ **Easy reset**: `db reset` gives clean slate
✅ **Offline work**: No internet required
✅ **Free**: No database costs during development
✅ **Migration confidence**: Test before production

## Estimated Time

- First setup: 5-10 minutes
- Daily workflow: 30 seconds to start
- Migration testing: 5 seconds to reset

**You'll save hours** compared to testing directly on production!

## Questions?

Common questions:

**Q: Will this affect my production database?**
A: No! Completely separate. Local uses different URLs and keys.

**Q: Do I need to keep Supabase running all the time?**
A: No, only when developing. `supabase stop` when done.

**Q: What about seed data?**
A: Create `supabase/seed.sql` for test data that runs on every reset.

**Q: Can I use both local and production?**
A: Yes! Just switch the URLs in `.env.local`.

Ready to try it? Run `npx supabase start` and you're off! 🚀
