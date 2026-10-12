#!/bin/sh
TEXT_TO_UI_BUNDLE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$TEXT_TO_UI_BUNDLE_DIR/runtime/node" "$TEXT_TO_UI_BUNDLE_DIR/skill-support/scripts/offline-runner.mjs" "$@"
