Initial prompts:

```
I want this script to make a list of all the valid routes in the `pages` folder. What qualifies as valid routes:
- It has a folder and a +Page.tsx
- pages/+Page.tsx should be '/'
- pages/index/+Page.tsx should be '/' as well
- pages/dashboard/+Page.tsx should be '/dashboard'
- pages/dashboard/settings/+Page.tsx should be '/dashboard/settings'
- pages/profiles/@slug/+Page.tsx should be '/profiles/@slug'
- There are also "ignored" paths like pages/(marketing)/index/+Page.tsx - should be '/'
- Other '+' prefixed files should be ignored. (i.e. +config.ts, +Layout.ts)
- Other files that don't relate to the above criteria are ignored, they are not routes. (i.e. my-component.ts)

And save it as this in route-tree.gen.ts:
const pageRoutes = [
   "/",
   "/dashboard",
]; // For example.

// Then:

type PageRoute = // a const literal of `pageRoutes`

Then I also want route-tree.gen.ts to have a function called:

export function getRoute(route, params) -> string.
- route is essentially a single PageRoute.
- params is any for now.
```

2nd

```
_error folder should be ignored, that is not a route.

I also noticed there is one issue that should be fixed in this script.
pages/dashboard for example becomes "dashboard". It should be "/dashboard"
pages/dashboard/settings for example becomes "dashboard/settings". It should be "/dashboard/settings"
```

3rd prompt:

```
Now, make the params: any work.

Make a utility type called VikeRouteParams or something,
wherein I just pass the PageRoute, I need to, and it will try to parse the routeParam for me from the @id or @slug.

if the route contains

/profiles/@id, then the resulting VikeRouteParams object should look like: {  id: string }.

Likewise, if there's
/profiles/@id/@repo, The object should look like: { id: string, repo: string }.

I think TypeScript is smart enough to be able to infer keywords on the string like @id and @repo. Remember those can be anything like @slug @id @repo @name, etc. So make sure those are not constants.
```

4th prompt:

```
params in getRoute should only be required if the resulting VikeRouteParams is not an empty object.
If it doesn't have any route params, don't require it (i.e. make it undefined)
```

getRoute should error if the second arg is not passed when the route passed requires a route param. i.e. getRoute("/profiles/@id") // It should error here.

But getRoute should also not error fi the second arg is not set, if the route passed does not require a route param. i.e. `getRoute("/dashboard").
