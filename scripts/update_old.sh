#!/bin/bash

set -e

SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $SCRIPT_PATH
cd ..

runuser -u www -- git restore .
runuser -u www -- git pull
systemctl restart telegram-bot-gggs
