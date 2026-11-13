# MSblog

Event-driven microservice blog (posts, comments, query, moderation, event-bus, client)
running on Kubernetes behind an API gateway.

## Ingress: Gateway API + Envoy Gateway

**Why not ingress-nginx:** archived by the Kubernetes project in March 2026 - no more
releases or CVE patches, and its successor (InGate) was cancelled. Gateway API is the
official replacement. Envoy Gateway is the CNCF implementation of it.

**Why a gateway at all:** without one, every service needs its own `LoadBalancer` -
one public IP and one bill each. A gateway gives you one entry point that routes by
hostname, path, and method.

### How it fits together

```
browser → blogapp.com:80 → LoadBalancer Service (auto-created)
                         → Envoy proxy pod  ← reads Host + path + method
                         → ClusterIP Service → your pod
```

Two separate programs: the **controller** (`envoy-gateway`) watches the K8s API and
pushes config to the **data plane** (Envoy pods) over xDS. Traffic only flows through
the data plane.

The chain of references - break any link and routing silently stops:

```
GatewayClass --controllerName--> the controller
Gateway      --gatewayClassName--> GatewayClass
HTTPRoute    --parentRefs--> Gateway
HTTPRoute    --backendRefs--> Service --selector--> Pod
```

| Object | Scope | Replaces | Owns |
|---|---|---|---|
| `GatewayClass` | cluster | `IngressClass` | which controller runs |
| `Gateway` | namespace | `Ingress` (ports/TLS half) | listeners, hostname, who may attach |
| `HTTPRoute` | namespace | `Ingress` (rules half) | paths → services |

Split this way so a service team can change its own routes without touching TLS or
another team's paths.

## Setup

### 1. Install the controller (once per cluster)

```powershell
kubectl apply --server-side -f https://github.com/envoyproxy/gateway/releases/download/v1.10.0/install.yaml
kubectl wait --for=condition=Available --timeout=300s -n envoy-gateway-system deployment/envoy-gateway
```

Installs the Gateway API CRDs (Kubernetes does not ship them - unlike `Ingress`), the
Envoy Gateway CRDs, and the controller. `--server-side` is required: CRDs this large
exceed the annotation size limit that client-side apply uses. Version is pinned
deliberately - `v0.0.0-latest` tracks an unreleased dev branch.

### 2. Point blogapp.com at the cluster

Add to `C:\Windows\System32\drivers\etc\hosts` (needs an elevated editor):

```
127.0.0.1 blogapp.com
```

A resolver override, not DNS - local to this machine. In production this is an A record
pointing at the load balancer; everything downstream is identical. Docker Desktop binds
the `LoadBalancer` Service to `localhost`, which is why `127.0.0.1` works. On bare metal
you need MetalLB, or the Gateway's address stays `<pending>` forever.

### 3. Deploy

```powershell
kubectl apply -f infra/k8s/
```

### 4. Verify, in this order

```powershell
kubectl get gatewayclass envoy-gateway       # ACCEPTED=True   -> controller sees the class
kubectl get gateway blog-gateway -o wide     # PROGRAMMED=True -> Envoy has the config, has an ADDRESS
kubectl get httproute                        # PARENTS lists blog-gateway -> routes attached
```

Test routing before trusting DNS - they fail independently:

```powershell
curl -i -H "Host: blogapp.com" http://localhost/post   # 200 - routing is correct
curl -i http://localhost/post                          # 404 - hostname matching is enforced
curl -i http://blogapp.com/post                        # 200 - DNS works too
```

## Routing

| Method + path | Service | Port |
|---|---|---|
| `POST /post` | `posts-clusterip-srv` | 4000 |
| `GET /post` | `querys-srv` | 4002 |
| `GET`/`POST` `/posts/<id>/comments` | `comments-srv` | 4001 |

Same path, two services, split by HTTP method - `Ingress` could not express this, so the
CQRS write and read sides share one clean URL.

`event-bus-srv` (4005) and `moderations-srv` (4003) have **no** route on purpose: they are
internal, pod-to-pod only. The absence of a route is the security control.

Precedence is set by the spec, not file order: exact hostname > wildcard, then
`Exact` > `RegularExpression` > `PathPrefix`, then longer path, then method match. So a
catch-all `/` route cannot shadow the API routes.

## Debugging

| Symptom | Cause |
|---|---|
| `ACCEPTED` not `True` | wrong `controllerName`, or controller not running |
| no `ADDRESS` on the Gateway | nothing fulfils `type: LoadBalancer` (bare metal: install MetalLB) |
| `ResolvedRefs: False` | `backendRefs` names a missing Service, or the wrong port |
| `NoMatchingListenerHostname` | route `hostnames` do not intersect the listener `hostname` |
| **404** from Envoy | no rule matched - routing problem |
| **503** from Envoy | rule matched, no healthy pods - check `kubectl get endpointslices` |

404 vs 503 is the fastest split: 404 is routing, 503 is backends.

```powershell
kubectl logs -n envoy-gateway-system deploy/envoy-gateway                               # controller
kubectl logs -n envoy-gateway-system -l gateway.envoyproxy.io/owning-gateway-name=blog-gateway -f   # access logs
```

## Known gotcha: CORS preflight returns 404

The client calls `http://blogapp.com/post` from vite on `localhost:5173` - cross-origin,
so the browser first sends `OPTIONS /post`. Both `/post` routes match on method
(`POST`, `GET`), so `OPTIONS` matches **neither** and Envoy 404s. The browser then blocks
the real request and reports it as a CORS error, even though the bug is in routing and
Express never sees the request.

Fix by adding a second match entry to `posts-route` (entries are OR'd):

```yaml
        - path:
            type: Exact
            value: /post
          method: OPTIONS
```

The real fix is same-origin: serve the client from the Gateway and use relative paths.

## TODO

- [ ] Add the client catch-all route (`client-depl.yaml` exists, its `HTTPRoute` does not):
      `PathPrefix: /` → `client-srv:5173`. Safe to add - precedence keeps API routes winning.
- [ ] Switch the client to relative paths (`/post`, `/posts/${id}/comments`) in
      `PostCreate.jsx`, `PostList.jsx`, `CommentCreate.jsx`, then delete `cors("*")`
      from all five services - same origin needs neither.
- [ ] Delete `infra/k8s/posts-srv.yaml` - that `LoadBalancer` on 4000 is a second front
      door bypassing the Gateway.
- [ ] Add `readinessProbe`s - without them Kubernetes routes to pods before Express is
      listening, causing intermittent 503s on deploy.
- [ ] TLS: add an HTTPS listener with `certificateRefs` + cert-manager. The hostname is
      already in place, so this is a two-field change.

## Versions

Envoy Gateway v1.10.0 · Gateway API v1.6.1 · Envoy 1.40.x · EOL 2027-05-05
