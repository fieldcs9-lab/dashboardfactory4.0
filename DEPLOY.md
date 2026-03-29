# Deploy Guide

## Render

1. Open Render and create a new Web Service from this GitHub repo.
2. Render can detect [render.yaml](/D:/mcDashboard/render.yaml) automatically.
3. If prompted:
   - Runtime: `Docker`
   - Branch: `main`
4. Deploy the service.
5. After the first deploy, open the generated Render URL and verify:
   - `/`
   - `/api/status.php`

## Railway

1. Open Railway and create a new project from this GitHub repo.
2. Railway should build from the included [Dockerfile](/D:/mcDashboard/Dockerfile).
3. Keep the default public domain first.
4. Verify:
   - `/`
   - `/api/status.php`

## Custom Domain Later

When you have a real domain:

1. Add the custom domain in Render or Railway.
2. Update DNS records at your domain provider.
3. Wait for SSL provisioning.
4. Re-test the site and API endpoint.

## API Base URL

The frontend now reads `window.APP_CONFIG.apiBaseUrl` from [config.js](/D:/mcDashboard/assets/js/config.js).

- Keep it as an empty string when frontend and API are served from the same host.
- Set it to a full URL later only if the API moves to a separate domain.
