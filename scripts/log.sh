#!/bin/bash
MESSAGES_COUNT=${1:-50}

docker logs telegram-bot-gggs -n $MESSAGES_COUNT --follow
