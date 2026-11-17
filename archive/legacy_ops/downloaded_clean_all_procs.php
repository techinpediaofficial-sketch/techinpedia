<?php
header("Content-Type: text/plain");
ini_set("display_errors", 1);

echo "=== HUNG PROCESS LIST FOR ACCOUNT USER ===\n";
$out = [];
@exec("ps aux 2>&1", $out);
echo implode("\n", $out) . "\n\n";

echo "=== KILLING ALL UNATTACHED NODE & PRISMA PROCESSES ===\n";
@exec("pkill -9 -u $(whoami) node 2>&1");
@exec("pkill -9 -u $(whoami) Passenger 2>&1");
@exec("pkill -9 -f query-engine 2>&1");
echo "Kill signal sent.\n\n";

sleep(1);

echo "=== PROCESS LIST AFTER CLEANUP ===\n";
$out2 = [];
@exec("ps aux 2>&1", $out2);
echo implode("\n", $out2) . "\n";
@unlink(__FILE__);
