#!/bin/bash

# Exit on any error
set -e

# Prompt for keystore password
# echo -n "Enter keystore password: "
# read -s KEYSTORE_PASSWORD
# echo  # Add newline after password input

# Using systemd because read -s doesn't work with my password
KEYSTORE_PASSWORD="$(systemd-ask-password "Enter keystore password:")"

# Build the Android APK with the provided keystore password
echo "Building Android APK..."
pnpm cap build android \
	--keystorepath /home/robert/Projects/nostrudel/keystore.jks \
	--keystorealias upload \
	--androidreleasetype APK \
	--keystorepass="$KEYSTORE_PASSWORD" \
	--keystorealiaspass="$KEYSTORE_PASSWORD" \
	--signing-type apksigner

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "Build successful!"
else
    echo "Build failed! Exiting..."
    exit 1
fi

# Prompt for nostr publisher signing variable
# echo -n "Enter SIGN_WITH value for nostr publisher: "
# read -s SIGN_WITH_VALUE

# Set nostr signer with user-provided value
export SIGN_WITH="$(systemd-ask-password "Enter nostr signer:")"

# Publish to zapstore
echo "Publishing to zapstore..."
zapstore publish
