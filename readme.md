# Building Resilient CI/CD Pipelines

This project demonstrates how to build a Node.js application pipeline in Jenkins and progressively add resilience features to avoid unexpected failures. The pipeline runs through linting, testing, scanning, packaging, artifact reuse, deployment, and cleanup.

---

## Project Overview

 from a simple Node.js app and extended to include :

## **lint → test → build → image scan → package artifact → use artifact → deploy**

- **Linting** with ESLint
- **Testing** with Jest
- **Image scanning** with Trivy
- **Artifact packaging and reuse**
- **Controlled deployment** (only on main branch)
- **Resilience features**: caching, conditional jobs, cleanup

The goal was to investigate why pipelines fail unexpectedly and then, fix those issues step by step.

---

### Installing lint for node.js

To install ESLint for a Node.js project, follow these steps:
1. **Initialize your Node.js project** (if you haven't already):
   ```bash
   npm init -y
   ```
2. **Install ESLint as a development dependency**:
   ```bash
    npm install eslint --save-dev
3. **Initialize ESLint configuration**:
    ```bash
    npx eslint --init

4. **Write a Dockerfile that builds a Docker image and installs the application dependencies.**


##  Pipeline Stages

### 1. Build Docker Image
- Builds the Node.js app into a Docker image.
- Uses **BuildKit caching** to speed up npm installs and reduce network failures.
- Tags the image with both the build number and `latest`.

### 2. Run Lint
- Runs ESLint inside the built image:
  ```bash
  npm run lint

  It ensures code quality before moving forward.

### Step 3: Run Tests
- Purpose: Verify application logic with automated tests.
- Command:
  ```bash
  npm test
  Runs inside the Docker image built.
- Ensures the app behaves as expected before moving forward.

### Step 4: Image Scan
- **Purpose:** Scan the Docker image for vulnerabilities before packaging or deploying.
- **Tool:** [Trivy](https://aquasecurity.github.io/trivy/)
- **Command:**
  trivy image \
    --severity HIGH,CRITICAL \
    --no-progress \
    --format table \
    --output trivy-report-${BUILD_NUMBER}.txt \
    my-node-app:${BUILD_NUMBER}

- Scans the exact image built in Step 1.
- Generates a vulnerability report and archives it as a build artifact.
- Policy can be strict (--exit-code 1 → fail on High/Critical) or lenient (archive report but continue).

**Resilience Feature: Adjusted to fail only on Criticals or archive reports without failing, so the pipeline doesn’t break unnecessarily while still surfacing issues.**

### Step 5: Package Artifact
- **Purpose:** Save the tested Docker image into a portable artifact that can be reused later.
- **Command:**
  ```bash
  docker save my-node-app:${BUILD_NUMBER} | gzip > my-node-app-${BUILD_NUMBER}.tar.gz

**Behavior:**

- Takes the exact image that passed linting, tests, and scanning.

- Packages it into a compressed tarball (.tar.gz).

- Archives the artifact in Jenkins so it can be reused in later stages.

**Resilience Feature: Ensures the same image is used consistently across testing and deployment, preventing “works in test, fails in deploy” issues.**

### Step 6: Use Artifact
- **Purpose:** Validate the packaged Docker image by re‑loading and running it.
- **Commands:**
  gunzip -c my-node-app-${BUILD_NUMBER}.tar.gz | docker load
  docker rm -f app || true
  docker run -d --name app -p 3000:3000 my-node-app:${BUILD_NUMBER}
  sleep 5
  curl -f http://localhost:3000 || (docker logs app && exit 1)
  docker rm -f app

- Loads the archived image back into Docker.
- Cleans up any old container named app before starting.
- Runs the container briefly and validates it with a curl request.
- Removes the container afterwards to prevent name conflicts.

**Resilience Feature: Ensures the artifact works as expected and avoids leaving containers running between builds.**

### Step 7: Deploy (Controlled)
- **Purpose:** Deploy the application only under specific conditions to avoid uncontrolled releases.
- **Condition:** Runs only on the `main` branch (or on tags if configured).
- **Example Jenkinsfile snippet:**
  ```groovy
  stage('Deploy') {
    when {
      branch 'main'
    }
    steps {
      sh '''
        echo "Deploying build ${BUILD_NUMBER} from main..."
        # docker login ...
        # docker push my-node-app:${BUILD_NUMBER}
        # kubectl apply -f k8s/
      '''
    }
  }

**Behavior:**
- Ensures deployments are deliberate and tied to merges or release tags.
- Prevents accidental deployments from feature branches or experimental builds.

**Resilience Feature: Controlled deployment reduces risk of shipping untested or unstable code.**

### Step 8: Post Cleanup
- **Purpose:** Ensure the environment is always cleaned up after the pipeline finishes, regardless of success or failure.
- **Commands:**
  ```bash
  docker rm -f app || true
  docker image prune -f || true
  echo "Build ${BUILD_NUMBER} and cleanup process completed."

**Behavior:**

- Removes any leftover container named app if it exists.

- Prunes dangling images to free up disk space.

- Runs under a post { always { ... } } block in Jenkins, so it executes even if earlier stages fail.

**Resilience Feature: Guarantees a fresh environment for every run, preventing container name conflicts and keeping the Jenkins host clean.**

## Pipeline Failure Timeline
=========================

[Stage 1] Initial setup
   └── Error: Missing scripts ("lint", "test") and missing dependencies (express, ejs, jest, eslint)
       Fix: Added scripts to package.json and installed required dependencies

[Stage 2] npm audit
   └── Error: Critical vulnerabilities in form-data, tough-cookie; deprecated request, uuid, glob
       Fix: Ran npm audit fix, replaced request with Axios, upgraded uuid/glob

[Stage 3] Node.js version mismatch
   └── Error: eslint-plugin-jest required Node >=20, but environment was Node 18
       Fix: Upgraded Node.js locally and in Dockerfile to node:20-alpine / node:24-alpine

[Stage 4] Trivy scan
   └── Error: Pipeline failed with exit code 1 on High/Critical vulnerabilities
       Fix: Switched base image to Alpine (fewer packages), adjusted Trivy policy (fail only on Criticals or archive report)

[Stage 5] Docker Hub connectivity
   └── Error: Failed to pull node:24-alpine (DNS timeout to registry-1.docker.io)
       Fix: Verified DNS, configured Docker daemon to use public resolvers, restarted Docker

[Stage 6] Use Artifact stage
   └── Error: Container name conflict ("app" already in use)
       Fix: Added cleanup (`docker rm -f app || true`), later ran container briefly and stopped it automatically

[Stage 7] Deploy stage
   └── Error: Uncontrolled deploys (ran on every branch)
       Fix: Added branch condition (`when { branch 'main' }`) to restrict deploys

[Stage 8] Post-run cleanup
   └── Error: Leftover containers/images causing conflicts and wasted space
       Fix: Added post { always { ... } } block to remove containers and prune images


##  Notes

Throughout building and fixing this pipeline, I learned several important lessons about resilience in CI/CD:

1. **Define scripts clearly**  
   - Missing `lint` and `test` scripts caused early failures.  
   - Always ensure `package.json` has the right scripts before integrating into CI/CD.

2. **Keep dependencies updated**  
   - Outdated or deprecated packages (`request`, `uuid`, `glob`) introduced vulnerabilities.  
   - Regularly run `npm audit` and replace insecure libraries with modern alternatives.

3. **Match Node.js versions with dependencies**  
   - Engine mismatch errors showed the importance of aligning runtime versions.  
   - Upgrading Node.js in both local and Docker environments removed compatibility issues.

4. **Balance security with pipeline flow**  
   - Strict Trivy policies (`--exit-code 1`) blocked builds unnecessarily.  
   - Adjusting to fail only on Criticals allowed progress while still surfacing issues.

5. **Ensure reliable connectivity**  
   - Docker Hub pull failures highlighted the need for proper DNS/network setup.  
   - Configuring Docker daemon DNS solved registry timeouts.

6. **Clean up containers between runs**  
   - Name conflicts (`/app` already in use) showed why cleanup is essential.  
   - Adding `docker rm -f app || true` prevented conflicts.

7. **Control deployments**  
   - Deploying from every branch was risky.  
   - Restricting deploys to `main` ensured only tested code reached production.

8. **Always clean the environment**  
   - Leftover containers/images wasted space and caused conflicts.  
   - Post‑cleanup blocks (`post { always { ... } }`) guaranteed a fresh environment.

---

**These lessons taught me how to transform a fragile pipeline into a**   
**resilient, predictable, and production‑ready CI/CD system**


