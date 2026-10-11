"""
Build and deploy the stack, taking optional secrets from the git-ignored infra/.env.

    python scripts/deploy.py [--profile Abhi] [--region us-east-1]

Secrets are passed to CloudFormation as NoEcho parameters and never printed. A secret missing from infra/.env keeps
its previously deployed value (so the admin key, set at first deploy, is never touched here).

infra/.env names -> stack parameters:
    FALLBACK_MODEL_API_KEY (or GROQ_API_KEY) -> FallbackModelApiKey
    TWILIO_ACCOUNT_SID -> TwilioAccountSid      TWILIO_AUTH_TOKEN -> TwilioAuthToken
    TWILIO_WHATSAPP_FROM -> TwilioWhatsAppFrom  DEMO_WHATSAPP_TO -> DemoWhatsAppTo
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / "infra" / ".env"
BUCKET = "aws-sam-cli-managed-default-samclisourcebucket-1vx1tvdtqz7m"
# Names are matched case-insensitively; the aliases cover common spellings (a Groq key is "gsk_...").
PARAMS = {"FALLBACK_MODEL_API_KEY": "FallbackModelApiKey", "GROQ_API_KEY": "FallbackModelApiKey",
          "GROK_API_KEY": "FallbackModelApiKey",
          "TWILIO_ACCOUNT_SID": "TwilioAccountSid", "TWILIO_AUTH_TOKEN": "TwilioAuthToken",
          "TWILIO_TOKEN": "TwilioAuthToken",
          "TWILIO_WHATSAPP_FROM": "TwilioWhatsAppFrom", "DEMO_WHATSAPP_TO": "DemoWhatsAppTo",
          "TWILIO_CONTENT_SID": "TwilioContentSid", "TWILIO_CONTENT_VARIABLES": "TwilioContentVariables",
          "META_WA_TOKEN": "MetaWaToken", "META_WA_PHONE_NUMBER_ID": "MetaWaPhoneNumberId",
          "APPROVAL_EMAIL": "ApprovalEmail", "APPROVAL_SMS_TO": "ApprovalSmsTo",
          "ALERT_EMAIL": "AlertEmail"}


def read_env(path: Path) -> dict:
    values = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                values[k.strip()] = v.strip().strip('"').strip("'")
    return values


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default="Abhi")
    ap.add_argument("--region", default="us-east-1")
    ap.add_argument("--stack", default="saans")
    args = ap.parse_args()
    env = {**os.environ, "AWS_PROFILE": args.profile, "AWS_DEFAULT_REGION": args.region}

    values = read_env(ENV_FILE)
    overrides = {PARAMS[k.upper()]: v for k, v in values.items() if k.upper() in PARAMS and v}
    print("Parameters from infra/.env:", ", ".join(sorted(overrides)) or "none")

    subprocess.run([sys.executable, str(ROOT / "scripts" / "build_lambda.py")], check=True)
    infra = ROOT / "infra"
    subprocess.run(["aws", "cloudformation", "package", "--template-file", "template.yaml", "--s3-bucket", BUCKET,
                    "--s3-prefix", args.stack, "--output-template-file", "packaged.yaml"],
                   cwd=infra, env=env, check=True, stdout=subprocess.DEVNULL)

    # Overrides go in a temporary JSON file, so no secret appears in the process list or shell history.
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump([f"{k}={v}" for k, v in overrides.items()], f)
        overrides_file = f.name
    try:
        cmd = ["aws", "cloudformation", "deploy", "--template-file", "packaged.yaml", "--stack-name", args.stack,
               "--capabilities", "CAPABILITY_IAM", "CAPABILITY_AUTO_EXPAND", "--no-fail-on-empty-changeset"]
        if overrides:
            cmd += ["--parameter-overrides", f"file://{overrides_file}"]
        subprocess.run(cmd, cwd=infra, env=env, check=True)
    finally:
        os.unlink(overrides_file)


if __name__ == "__main__":
    main()
