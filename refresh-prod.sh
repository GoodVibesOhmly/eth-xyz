#!/bin/bash
git pull;
node ace build --production --ignore-ts-errors;
mv ../eth-xyz-live ../eth-xyz-previous;
mv build ../eth-xyz-live;
rm -rf ../eth-xyz-previous
cp .env ../eth-xyz-live/.env;
cd ../eth-xyz-live;
forever stopall;
forever start server.js;
cd ../eth-xyz
