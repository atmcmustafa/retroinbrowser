import "server-only";
import { serverEnv } from "@/lib/env.server";

const repository = process.env.GITHUB_REPOSITORY ?? "atmcmustafa/retroinbrowser";

export type DeployResult = { ok: true } | { ok: false; message: string };

// The live site is static: data changes show up once the Deploy workflow rebuilds it, which
// runs daily after the link check. This starts it now. Locally it needs GITHUB_DEPLOY_TOKEN
// (a fine-grained token with Actions: write on the repository).
export async function requestDeploy(): Promise<DeployResult> {
  const token = serverEnv.GITHUB_DEPLOY_TOKEN ?? serverEnv.GITHUB_TOKEN;
  if (!token) {
    return { ok: false, message: "GITHUB_DEPLOY_TOKEN isn't set. Run Deploy on GitHub instead." };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repository}/actions/workflows/deploy.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "retroinbrowser-deploy",
        },
        body: JSON.stringify({ ref: "main" }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (res.status === 204) return { ok: true };
    console.error("Starting the deploy failed", res.status, await res.text());
    return { ok: false, message: `GitHub refused the deploy (${res.status}).` };
  } catch (error) {
    console.error("Starting the deploy failed", error);
    return { ok: false, message: "Couldn't reach GitHub. Try again." };
  }
}
