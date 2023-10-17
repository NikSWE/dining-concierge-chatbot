#!/bin/bash

rm ServiceRequestLambda.zip
cd package
zip -r ../ServiceRequestLambda.zip .
cd ..
zip ServiceRequestLambda.zip ServiceRequestLambda.py