#!/usr/bin/env bash
# create-keystore.sh — Generate a release signing keystore for Gym Forged Android.
#
# Run ONCE. Keep keystore.jks and keystore.properties out of git (both are gitignored).
#
# Usage:
#   bash scripts/create-keystore.sh
#   # Prompts for passwords twice (store + key). Use the same password for both to keep it simple.
#
# After running:
#   1. Move keystore.jks to android/keystore.jks  (rootProject dir for Gradle)
#   2. Create android/keystore.properties          (rootProject dir — also gitignored)
#   3. For CI: base64-encode and add to GitHub secrets (instructions printed below)

set -euo pipefail

ALIAS="gym-forged"
KEYSTORE="keystore.jks"
VALIDITY_DAYS=10000   # ~27 years

echo ""
echo "=== Gym Forged Android Release Keystore ==="
echo "Output: ${KEYSTORE}"
echo ""

keytool \
  -genkeypair \
  -v \
  -keystore "${KEYSTORE}" \
  -alias "${ALIAS}" \
  -keyalg RSA \
  -keysize 4096 \
  -validity ${VALIDITY_DAYS} \
  -dname "CN=Gym Forged, OU=Mobile, O=GymForged, L=Unknown, ST=Unknown, C=US"

echo ""
echo "======================================================="
echo "Keystore created: ${KEYSTORE}"
echo ""
echo "Step 1 — Move keystore to android/ directory:"
echo "  mv ${KEYSTORE} android/${KEYSTORE}"
echo ""
echo "Step 2 — Create android/keystore.properties:"
echo "  (Gradle reads this via rootProject.file('keystore.properties'))"
echo ""
cat <<PROPS
  storeFile=${KEYSTORE}
  storePassword=<your-store-password>
  keyAlias=${ALIAS}
  keyPassword=<your-key-password>
PROPS
echo ""
echo "Step 3 — Add GitHub Actions secrets (Settings → Secrets → Actions):"
echo "  KEYSTORE_BASE64   \$(base64 -w0 android/${KEYSTORE})"
echo "  KEYSTORE_PASSWORD <your-store-password>"
echo "  KEY_ALIAS         ${ALIAS}"
echo "  KEY_PASSWORD      <your-key-password>"
echo ""
echo "Step 4 — Test local release build:"
echo "  cd android && ./gradlew bundleRelease --no-daemon"
echo "  # AAB at: android/app/build/outputs/bundle/release/app-release.aab"
echo "======================================================="
