# Toastmasters Mongolia Club: role sign-up

A web page where members pick their meeting roles and dates. Sign-ups are saved on Netlify (Netlify Blobs) and shown to everyone.

## Files
- `public/index.html`, `public/app.js`: the page members see.
- `netlify/functions/signups.mts`, `config.mts`, `lib/handler.mts`: the small server part that saves and lists sign-ups.
- `netlify/functions/lib/config.mts`: **meeting dates and roles.** Edit this file to add new Thursdays; Netlify rebuilds automatically after you commit.
- Member names are not in this public repository. They are set in Netlify as the `MEMBERS` setting.

## Settings (Netlify, Project configuration, Environment variables)
- `CLUB_CODE`: access code members type once. Leave empty for open access.
- `MEMBERS`: JSON list of member names for the "Who are you?" list, e.g. `["Name One","Name Two"]`. Redeploy after changing it.
- `ADMIN_CODE`: VPE code. Lets the VPE cancel anyone's role and copy the schedule table for the Google Sheet.

## Sync to the Google Sheet
`GET /api/signups?format=text&code=<CLUB_CODE>` returns one line per sign-up: `<date>_<roleid>` then a tab, then the member name.
