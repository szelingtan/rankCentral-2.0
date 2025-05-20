# GitLab CI/CD Integration for rankCentral

This document explains how to set up GitLab CI/CD for the rankCentral Next.js application.

## Required GitLab CI/CD Variables

Set the following variables in your GitLab project (Settings > CI/CD > Variables):

### Authentication Variables

- `SSH_PRIVATE_KEY`: SSH private key for deploying to servers
- `SSH_KNOWN_HOSTS`: Known hosts file content for secure SSH connections
- `CI_REGISTRY_USER`: GitLab registry username (should be predefined)
- `CI_REGISTRY_PASSWORD`: GitLab registry password (should be predefined)
- `CI_REGISTRY`: GitLab registry URL (should be predefined)

### Server Configuration

- `STAGING_SERVER_HOST`: Hostname/IP of your staging server
- `STAGING_SERVER_USER`: SSH username for staging server
- `PRODUCTION_SERVER_HOST`: Hostname/IP of your production server
- `PRODUCTION_SERVER_USER`: SSH username for production server

### Database Configuration

- `MONGO_INITDB_ROOT_USERNAME`: MongoDB root username for production
- `MONGO_INITDB_ROOT_PASSWORD`: MongoDB root password for production

## Deployment Process

1. **Testing**: Runs linting and tests on every push to main and merge requests
2. **Building**: Builds Docker image and pushes to GitLab Container Registry
3. **Staging Deployment**: Manual deployment to staging environment
4. **Production Deployment**: Manual deployment to production environment (only on tagged commits)

## Environment Files

- `.env.docker`: Used for local Docker development
- `.env.production`: Used for production deployment (not in version control)
- `.env.production.template`: Template for production environment file

## Important Notes

- Production deployment only happens on tagged commits (e.g., `v1.0.0`)
- Staging deployment is manual but can be triggered from any commit on main
- MongoDB data is persisted in Docker volumes
- Traefik is used as a reverse proxy for HTTPS

## Local Testing

You can test the CI/CD pipeline locally with GitLab Runner:

```bash
# Install GitLab Runner
brew install gitlab-runner

# Run a specific job
gitlab-runner exec docker test
```
