#!/bin/bash
export SSHPASS="Himanshu@123"
echo "Cleaning up stuck build processes on server..."
sshpass -e ssh -o StrictHostKeyChecking=no -p 22 hellomam@66.116.199.2 "pkill -f 'next build' || true; pkill -f 'next-swc' || true; pkill -f 'webpack' || true"
echo "Done! Server resources are freed."
